import { MutationCtx, QueryCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";
import { recordActivity } from "./activityLog";
import {
  HOUSEHOLD_BILLS_GROUP,
  adjustmentForAllocation,
  planBillChange,
  toPence,
  type StoredAllocation,
} from "./credit";
import type { CreditAdjustment } from "./settlement";

const toPounds = (pence: number) => pence / 100;

export function storedAllocation(allocation: Doc<"creditAllocations">): StoredAllocation {
  return {
    pence: toPence(allocation.amount),
    adjustmentPence: toPence(allocation.adjustment),
  };
}

export async function householdUsers(
  ctx: QueryCtx,
): Promise<[Doc<"users"> | null, Doc<"users"> | null]> {
  const users = await ctx.db.query("users").order("asc").take(2);
  return [users[0] ?? null, users[1] ?? null];
}

export async function isMonthSettled(ctx: QueryCtx, month: string): Promise<boolean> {
  const row = await ctx.db
    .query("settlements")
    .withIndex("by_month", (q) => q.eq("month", month))
    .first();
  return row !== null;
}

export async function isHouseholdBillCategory(
  ctx: QueryCtx,
  categoryId: Id<"categories">,
): Promise<boolean> {
  const category = await ctx.db.get(categoryId);
  return category?.group === HOUSEHOLD_BILLS_GROUP;
}

function toAdjustments(
  allocations: Doc<"creditAllocations">[],
  credits: Map<Id<"credits">, Doc<"credits"> | null>,
): CreditAdjustment[] {
  const adjustments: CreditAdjustment[] = [];
  for (const allocation of allocations) {
    const credit = credits.get(allocation.creditId);
    if (!credit) continue;
    const stored = storedAllocation(allocation);
    adjustments.push({
      holderId: credit.holderId,
      pence: stored.pence,
      adjustmentPence: stored.adjustmentPence,
    });
  }
  return adjustments;
}

async function creditsById(
  ctx: QueryCtx,
  ids: Id<"credits">[],
): Promise<Map<Id<"credits">, Doc<"credits"> | null>> {
  const unique = [...new Set(ids)];
  const rows = await Promise.all(unique.map((id) => ctx.db.get(id)));
  return new Map(unique.map((id, index) => [id, rows[index]]));
}

/** The credit adjustments for one month, ready for computeMonthTotals. */
export async function creditAdjustmentsForMonth(
  ctx: QueryCtx,
  month: string,
): Promise<{ adjustments: CreditAdjustment[]; allocations: Doc<"creditAllocations">[] }> {
  const allocations = await ctx.db
    .query("creditAllocations")
    .withIndex("by_month", (q) => q.eq("month", month))
    .collect();
  if (allocations.length === 0) return { adjustments: [], allocations };
  const credits = await creditsById(ctx, allocations.map((allocation) => allocation.creditId));
  return { adjustments: toAdjustments(allocations, credits), allocations };
}

/** Every month's credit adjustments, for open balances. */
export async function creditAdjustmentsByMonth(
  ctx: QueryCtx,
): Promise<Map<string, CreditAdjustment[]>> {
  const [allocations, credits] = await Promise.all([
    ctx.db.query("creditAllocations").collect(),
    ctx.db.query("credits").collect(),
  ]);
  const creditMap = new Map(credits.map((credit) => [credit._id, credit]));
  const byMonth = new Map<string, CreditAdjustment[]>();
  for (const allocation of allocations) {
    const [adjustment] = toAdjustments([allocation], creditMap);
    if (!adjustment) continue;
    const rows = byMonth.get(allocation.month) ?? [];
    rows.push(adjustment);
    byMonth.set(allocation.month, rows);
  }
  return byMonth;
}

/** Recompute a resized allocation's adjustment against the rest of its credit. */
export async function adjustmentAfterResize(
  ctx: QueryCtx,
  allocation: Doc<"creditAllocations">,
  pence: number,
): Promise<number> {
  const siblings = await ctx.db
    .query("creditAllocations")
    .withIndex("by_credit", (q) => q.eq("creditId", allocation.creditId))
    .collect();
  return adjustmentForAllocation(
    siblings.filter((row) => row._id !== allocation._id).map(storedAllocation),
    pence,
  );
}

/**
 * Keep credit on an expense consistent with an edit (`after`) or a delete
 * (`after` is null). Throws, rolling back the whole mutation, when the
 * change would move credit in a settled month.
 */
export async function syncExpenseCredit(
  ctx: MutationCtx,
  actorId: Id<"users">,
  before: Doc<"expenses">,
  after: Doc<"expenses"> | null,
): Promise<void> {
  const allocations = await ctx.db
    .query("creditAllocations")
    .withIndex("by_expense", (q) => q.eq("expenseId", before._id))
    .collect();
  if (allocations.length === 0) return;

  const credits = await creditsById(ctx, allocations.map((allocation) => allocation.creditId));
  const snapshot = async (expense: Doc<"expenses">) => ({
    pence: toPence(expense.amount),
    date: expense.date,
    month: expense.month,
    split: expense.splitType,
    categoryId: expense.categoryId,
    inHouseholdBills: await isHouseholdBillCategory(ctx, expense.categoryId),
  });

  const plan = planBillChange(
    allocations.map((allocation) => ({
      id: allocation._id,
      creditReceivedOn: credits.get(allocation.creditId)?.receivedOn ?? "",
      pence: toPence(allocation.amount),
    })),
    await snapshot(before),
    after ? await snapshot(after) : null,
    {
      before: await isMonthSettled(ctx, before.month),
      after: after ? await isMonthSettled(ctx, after.month) : false,
    },
  );
  if ("reason" in plan) throw new Error(plan.reason);

  const byId = new Map(allocations.map((allocation) => [allocation._id as string, allocation]));
  const description = after?.description ?? before.description;
  for (const change of plan.changes) {
    const allocation = byId.get(change.id);
    if (!allocation) continue;
    if (change.kind === "move") {
      await ctx.db.patch(allocation._id, { month: change.month });
      continue;
    }
    const releasedPence =
      change.kind === "release" ? toPence(allocation.amount) : toPence(allocation.amount) - change.pence;
    if (change.kind === "release") {
      await ctx.db.delete(allocation._id);
    } else {
      const adjustmentPence = await adjustmentAfterResize(ctx, allocation, change.pence);
      await ctx.db.patch(allocation._id, {
        amount: toPounds(change.pence),
        adjustment: toPounds(adjustmentPence),
        month: change.month,
      });
    }
    await recordActivity(ctx, {
      action: "credit.released",
      actorId,
      amount: toPounds(releasedPence),
      description,
      creditId: allocation.creditId,
      expenseId: before._id,
      month: allocation.month,
    });
  }
}

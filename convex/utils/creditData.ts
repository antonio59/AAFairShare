import { ConvexError } from "convex/values";
import { MutationCtx, QueryCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";
import { recordActivity } from "./activityLog";
import {
  HOUSEHOLD_BILLS_GROUP,
  adjustmentForAllocation,
  creditBalance,
  planAutoAllocations,
  planBillAllocation,
  planBillChange,
  toPence,
  type BillState,
  type CandidateCredit,
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
    if (!credit) throw new Error("A refund credit draw points at a credit that no longer exists");
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
  if ("reason" in plan) throw new ConvexError(plan.reason);

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

type Household = [Doc<"users"> | null, Doc<"users"> | null];

const holds = (household: Household, holderId: Id<"users">) =>
  holderId === household[0]?._id || holderId === household[1]?._id;

/** A credit's state for the planners, read from its current allocations. */
export async function creditStateOf(
  ctx: QueryCtx,
  credit: Doc<"credits">,
  household: Household,
): Promise<CandidateCredit> {
  const allocations = await ctx.db
    .query("creditAllocations")
    .withIndex("by_credit", (q) => q.eq("creditId", credit._id))
    .collect();
  return {
    id: credit._id,
    amountPence: toPence(credit.amount),
    receivedOn: credit.receivedOn,
    closed: credit.closedAt !== undefined,
    allocatedPence: creditBalance(toPence(credit.amount), allocations.map(storedAllocation)).allocatedPence,
    holderInHousehold: holds(household, credit.holderId),
  };
}

/** A bill's state for the planners, and which credits it already uses. */
export async function billStateOf(
  ctx: QueryCtx,
  expense: Doc<"expenses">,
): Promise<{ bill: Omit<BillState, "alreadyUsesThisCredit">; usedCreditIds: Set<string> }> {
  const onExpense = await ctx.db
    .query("creditAllocations")
    .withIndex("by_expense", (q) => q.eq("expenseId", expense._id))
    .collect();
  return {
    bill: {
      pence: toPence(expense.amount),
      date: expense.date,
      month: expense.month,
      split: expense.splitType,
      inHouseholdBills: await isHouseholdBillCategory(ctx, expense.categoryId),
      allocatedPence: onExpense.reduce((total, row) => total + toPence(row.amount), 0),
      monthSettled: await isMonthSettled(ctx, expense.month),
    },
    usedCreditIds: new Set(onExpense.map((row) => row.creditId as string)),
  };
}

/**
 * Draw from one credit onto one bill, re-checking every rule against what is
 * stored now. Returns the refusal instead of throwing so automatic callers
 * can skip quietly.
 */
export async function drawOntoBill(
  ctx: MutationCtx,
  args: {
    credit: Doc<"credits">;
    expense: Doc<"expenses">;
    household: Household;
    requestedPence?: number;
    actorId?: Id<"users">;
    automatic: boolean;
  },
): Promise<{ id: Id<"creditAllocations">; pence: number } | { reason: string }> {
  const { credit, expense } = args;
  const others = await ctx.db
    .query("creditAllocations")
    .withIndex("by_credit", (q) => q.eq("creditId", credit._id))
    .collect();
  const stored = others.map(storedAllocation);
  const { bill, usedCreditIds } = await billStateOf(ctx, expense);
  const plan = planBillAllocation(
    {
      amountPence: toPence(credit.amount),
      receivedOn: credit.receivedOn,
      closed: credit.closedAt !== undefined,
      allocatedPence: creditBalance(toPence(credit.amount), stored).allocatedPence,
      holderInHousehold: holds(args.household, credit.holderId),
    },
    { ...bill, alreadyUsesThisCredit: usedCreditIds.has(credit._id) },
    args.requestedPence,
  );
  if ("reason" in plan) return { reason: plan.reason };

  const id = await ctx.db.insert("creditAllocations", {
    creditId: credit._id,
    kind: "bill",
    expenseId: expense._id,
    month: expense.month,
    amount: toPounds(plan.pence),
    adjustment: toPounds(adjustmentForAllocation(stored, plan.pence)),
    createdBy: args.actorId,
    automatic: args.automatic || undefined,
  });
  await recordActivity(ctx, {
    action: "credit.applied",
    actorId: args.actorId,
    amount: toPounds(plan.pence),
    description: expense.description,
    creditId: credit._id,
    expenseId: expense._id,
    month: expense.month,
    automatic: args.automatic || undefined,
  });
  return { id, pence: plan.pence };
}

/** Credits that could still go on a bill dated `date`, oldest first. */
async function openCreditsUpTo(ctx: QueryCtx, date: string): Promise<Doc<"credits">[]> {
  const credits = await ctx.db
    .query("credits")
    .withIndex("by_received_on", (q) => q.lte("receivedOn", date))
    .collect();
  return credits.filter((credit) => credit.closedAt === undefined);
}

/**
 * Use open credits on a bill, oldest credit first, until it is covered.
 * Bills that cannot use credit are left alone, so this is safe to call after
 * every expense insert. Runs in the caller's transaction, so concurrent bills
 * cannot overdraw a credit.
 */
export async function applyCreditsToBill(
  ctx: MutationCtx,
  expense: Doc<"expenses">,
  options: { actorId?: Id<"users">; automatic: boolean },
): Promise<number> {
  if (expense.splitType !== "50/50") return 0;
  if (!(await isHouseholdBillCategory(ctx, expense.categoryId))) return 0;
  const credits = await openCreditsUpTo(ctx, expense.date);
  if (credits.length === 0) return 0;

  const household = await householdUsers(ctx);
  const { bill, usedCreditIds } = await billStateOf(ctx, expense);
  const states = await Promise.all(credits.map((credit) => creditStateOf(ctx, credit, household)));
  const draws = planAutoAllocations(states, bill, usedCreditIds);
  const byId = new Map(credits.map((credit) => [credit._id as string, credit]));

  let usedPence = 0;
  for (const draw of draws) {
    const credit = byId.get(draw.id);
    if (!credit) continue;
    const result = await drawOntoBill(ctx, {
      credit,
      expense,
      household,
      requestedPence: draw.pence,
      actorId: options.actorId,
      automatic: options.automatic,
    });
    if ("pence" in result) usedPence += result.pence;
  }
  return usedPence;
}

/** Bills this credit was taken off; automation never puts it back on them. */
export async function billsReleasedFrom(
  ctx: QueryCtx,
  creditId: Id<"credits">,
): Promise<Set<string>> {
  const rows = await ctx.db
    .query("activities")
    .withIndex("by_credit", (q) => q.eq("creditId", creditId))
    .collect();
  return new Set(
    rows
      .filter((row) => row.action === "credit.released" && row.expenseId)
      .map((row) => row.expenseId as string),
  );
}

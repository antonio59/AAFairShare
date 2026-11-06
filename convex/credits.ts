import { v } from "convex/values";
import { mutation, query, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireAuthenticatedUser } from "./utils/auth";
import {
  assertPositiveAmount,
  assertValidDate,
  assertValidMonth,
} from "./utils/validation";
import { roundToPence } from "./utils/money";
import { recordActivity } from "./utils/activityLog";
import {
  adjustmentForAllocation,
  creditBalance,
  planBillAllocation,
  planPayout,
  toPence,
} from "./utils/credit";
import {
  householdUsers,
  isHouseholdBillCategory,
  isMonthSettled,
  storedAllocation,
} from "./utils/creditData";
import { householdDisplayName } from "./utils/settlementPlan";

const toPounds = (pence: number) => pence / 100;

function creditLabel(credit: Pick<Doc<"credits">, "description">): string {
  return credit.description?.trim() || "Refund credit";
}

async function loadCredit(ctx: MutationCtx, creditId: Id<"credits">) {
  const credit = await ctx.db.get(creditId);
  if (!credit) throw new Error("Credit not found");
  const allocations = await ctx.db
    .query("creditAllocations")
    .withIndex("by_credit", (q) => q.eq("creditId", creditId))
    .collect();
  return { credit, allocations };
}

async function assertHouseholdMember(ctx: MutationCtx, userId: Id<"users">) {
  const [user1, user2] = await householdUsers(ctx);
  if (!user1 || !user2) throw new Error("Two people are needed to share a credit");
  if (userId !== user1._id && userId !== user2._id) {
    throw new Error("The credit holder must be one of the two people in the household");
  }
}

async function holderInHousehold(ctx: MutationCtx, holderId: Id<"users">) {
  const [user1, user2] = await householdUsers(ctx);
  return holderId === user1?._id || holderId === user2?._id;
}

async function settledMonthsOf(ctx: MutationCtx, allocations: Doc<"creditAllocations">[]) {
  const months = [...new Set(allocations.map((allocation) => allocation.month))];
  const settled = await Promise.all(months.map((month) => isMonthSettled(ctx, month)));
  return months.filter((_, index) => settled[index]);
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);
    const [credits, allocations, settlements, users] = await Promise.all([
      ctx.db.query("credits").withIndex("by_received_on").collect(),
      ctx.db.query("creditAllocations").collect(),
      ctx.db.query("settlements").collect(),
      householdUsers(ctx),
    ]);
    const settled = new Set(settlements.map((row) => row.month));
    const names = new Map<string, string>();
    users.forEach((user, index) => {
      if (user) names.set(user._id, householdDisplayName(user, `User ${index + 1}`));
    });

    return await Promise.all(
      credits.map(async (credit) => {
        const own = allocations.filter((allocation) => allocation.creditId === credit._id);
        const balance = creditBalance(toPence(credit.amount), own.map(storedAllocation));
        const rows = await Promise.all(
          own.map(async (allocation) => {
            const expense = allocation.expenseId ? await ctx.db.get(allocation.expenseId) : null;
            return {
              _id: allocation._id,
              kind: allocation.kind,
              expenseId: allocation.expenseId ?? null,
              expenseDescription: expense?.description ?? null,
              month: allocation.month,
              amount: allocation.amount,
              adjustment: allocation.adjustment,
              settled: settled.has(allocation.month),
            };
          }),
        );
        return {
          _id: credit._id,
          amount: credit.amount,
          receivedOn: credit.receivedOn,
          holderId: credit.holderId,
          holderName: names.get(credit.holderId) ?? "Someone",
          description: credit.description ?? null,
          closed: credit.closedAt !== undefined,
          allocated: toPounds(balance.allocatedPence),
          remaining: toPounds(balance.remainingPence),
          othersShareRemaining: toPounds(balance.othersShareRemainingPence),
          allocations: rows,
        };
      }),
    );
  },
});

export const create = mutation({
  args: {
    amount: v.number(),
    receivedOn: v.string(),
    holderId: v.id("users"),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);
    const amount = roundToPence(args.amount);
    assertPositiveAmount(amount, "amount");
    assertValidDate(args.receivedOn, "receivedOn");
    await assertHouseholdMember(ctx, args.holderId);
    const description = args.description?.trim().slice(0, 200) || undefined;

    const creditId = await ctx.db.insert("credits", {
      amount,
      receivedOn: args.receivedOn,
      holderId: args.holderId,
      description,
      createdBy: userId,
    });
    await recordActivity(ctx, {
      action: "credit.added",
      actorId: userId,
      amount,
      description: creditLabel({ description }),
      creditId,
      fromUserId: args.holderId,
    });
    return creditId;
  },
});

export const update = mutation({
  args: {
    id: v.id("credits"),
    amount: v.optional(v.number()),
    receivedOn: v.optional(v.string()),
    holderId: v.optional(v.id("users")),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);
    const { credit, allocations } = await loadCredit(ctx, args.id);
    const patch: Partial<Doc<"credits">> = {};

    if (args.amount !== undefined) {
      const amount = roundToPence(args.amount);
      assertPositiveAmount(amount, "amount");
      const { allocatedPence } = creditBalance(toPence(amount), allocations.map(storedAllocation));
      if (toPence(amount) < allocatedPence) {
        throw new Error(`£${toPounds(allocatedPence).toFixed(2)} of this credit is already used`);
      }
      patch.amount = amount;
    }

    if (args.holderId !== undefined && args.holderId !== credit.holderId) {
      await assertHouseholdMember(ctx, args.holderId);
      const settled = await settledMonthsOf(ctx, allocations);
      if (settled.length > 0) {
        throw new Error(`Credit is used in settled ${settled.join(", ")}. Unsettle first to change who holds it.`);
      }
      patch.holderId = args.holderId;
    }

    if (args.receivedOn !== undefined && args.receivedOn !== credit.receivedOn) {
      assertValidDate(args.receivedOn, "receivedOn");
      for (const allocation of allocations) {
        const expense = allocation.expenseId ? await ctx.db.get(allocation.expenseId) : null;
        const tooEarly = expense
          ? expense.date < args.receivedOn
          : allocation.month < args.receivedOn.slice(0, 7);
        if (tooEarly) {
          throw new Error("Some of this credit is used before that date. Release it first.");
        }
      }
      patch.receivedOn = args.receivedOn;
    }

    if (args.description !== undefined) {
      patch.description = args.description.trim().slice(0, 200) || undefined;
    }

    await ctx.db.patch(args.id, patch);
    await recordActivity(ctx, {
      action: "credit.edited",
      actorId: userId,
      amount: patch.amount ?? credit.amount,
      description: creditLabel({ description: "description" in patch ? patch.description : credit.description }),
      creditId: args.id,
      fromUserId: patch.holderId ?? credit.holderId,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("credits") },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);
    const { credit, allocations } = await loadCredit(ctx, args.id);
    const settled = await settledMonthsOf(ctx, allocations);
    if (settled.length > 0) {
      throw new Error(
        `Credit is used in settled ${settled.join(", ")}. Close it or cash it out instead.`,
      );
    }
    for (const allocation of allocations) {
      await ctx.db.delete(allocation._id);
    }
    await ctx.db.delete(args.id);
    await recordActivity(ctx, {
      action: "credit.removed",
      actorId: userId,
      amount: credit.amount,
      description: creditLabel(credit),
      creditId: args.id,
      fromUserId: credit.holderId,
    });
  },
});

export const close = mutation({
  args: { id: v.id("credits") },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);
    const credit = await ctx.db.get(args.id);
    if (!credit) throw new Error("Credit not found");
    if (credit.closedAt !== undefined) return;
    await ctx.db.patch(args.id, { closedAt: Date.now() });
    await recordActivity(ctx, {
      action: "credit.closed",
      actorId: userId,
      amount: credit.amount,
      description: creditLabel(credit),
      creditId: args.id,
    });
  },
});

export const reopen = mutation({
  args: { id: v.id("credits") },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);
    const credit = await ctx.db.get(args.id);
    if (!credit) throw new Error("Credit not found");
    if (credit.closedAt === undefined) return;
    await ctx.db.patch(args.id, { closedAt: undefined });
    await recordActivity(ctx, {
      action: "credit.reopened",
      actorId: userId,
      amount: credit.amount,
      description: creditLabel(credit),
      creditId: args.id,
    });
  },
});

export const applyToExpense = mutation({
  args: {
    creditId: v.id("credits"),
    expenseId: v.id("expenses"),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);
    const { credit, allocations } = await loadCredit(ctx, args.creditId);
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) throw new Error("Expense not found");
    const onExpense = await ctx.db
      .query("creditAllocations")
      .withIndex("by_expense", (q) => q.eq("expenseId", args.expenseId))
      .collect();

    let requestedPence: number | undefined;
    if (args.amount !== undefined) {
      const amount = roundToPence(args.amount);
      assertPositiveAmount(amount, "amount");
      requestedPence = toPence(amount);
    }

    const stored = allocations.map(storedAllocation);
    const plan = planBillAllocation(
      {
        amountPence: toPence(credit.amount),
        receivedOn: credit.receivedOn,
        closed: credit.closedAt !== undefined,
        allocatedPence: creditBalance(toPence(credit.amount), stored).allocatedPence,
        holderInHousehold: await holderInHousehold(ctx, credit.holderId),
      },
      {
        pence: toPence(expense.amount),
        date: expense.date,
        month: expense.month,
        split: expense.splitType,
        inHouseholdBills: await isHouseholdBillCategory(ctx, expense.categoryId),
        allocatedPence: onExpense.reduce((total, row) => total + toPence(row.amount), 0),
        alreadyUsesThisCredit: onExpense.some((row) => row.creditId === args.creditId),
        monthSettled: await isMonthSettled(ctx, expense.month),
      },
      requestedPence,
    );
    if ("reason" in plan) throw new Error(plan.reason);

    const allocationId = await ctx.db.insert("creditAllocations", {
      creditId: args.creditId,
      kind: "bill",
      expenseId: args.expenseId,
      month: expense.month,
      amount: toPounds(plan.pence),
      adjustment: toPounds(adjustmentForAllocation(stored, plan.pence)),
      createdBy: userId,
    });
    await recordActivity(ctx, {
      action: "credit.applied",
      actorId: userId,
      amount: toPounds(plan.pence),
      description: expense.description,
      creditId: args.creditId,
      expenseId: args.expenseId,
      month: expense.month,
    });
    return allocationId;
  },
});

export const releaseAllocation = mutation({
  args: { id: v.id("creditAllocations") },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);
    const allocation = await ctx.db.get(args.id);
    if (!allocation) throw new Error("Credit use not found");
    if (await isMonthSettled(ctx, allocation.month)) {
      throw new Error(`Unsettle ${allocation.month} first`);
    }
    const expense = allocation.expenseId ? await ctx.db.get(allocation.expenseId) : null;
    const credit = await ctx.db.get(allocation.creditId);
    await ctx.db.delete(args.id);
    await recordActivity(ctx, {
      action: "credit.released",
      actorId: userId,
      amount: allocation.amount,
      description: expense?.description ?? (credit ? creditLabel(credit) : undefined),
      creditId: allocation.creditId,
      expenseId: allocation.expenseId,
      month: allocation.month,
    });
  },
});

export const cashOut = mutation({
  args: { id: v.id("credits"), month: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);
    assertValidMonth(args.month, "month");
    const { credit, allocations } = await loadCredit(ctx, args.id);
    const stored = allocations.map(storedAllocation);
    const plan = planPayout(
      {
        amountPence: toPence(credit.amount),
        receivedOn: credit.receivedOn,
        allocatedPence: creditBalance(toPence(credit.amount), stored).allocatedPence,
        holderInHousehold: await holderInHousehold(ctx, credit.holderId),
      },
      args.month,
      await isMonthSettled(ctx, args.month),
    );
    if ("reason" in plan) throw new Error(plan.reason);

    const allocationId = await ctx.db.insert("creditAllocations", {
      creditId: args.id,
      kind: "payout",
      month: args.month,
      amount: toPounds(plan.pence),
      adjustment: toPounds(adjustmentForAllocation(stored, plan.pence)),
      createdBy: userId,
    });
    await recordActivity(ctx, {
      action: "credit.cashed_out",
      actorId: userId,
      amount: toPounds(plan.pence),
      description: creditLabel(credit),
      creditId: args.id,
      month: args.month,
    });
    return allocationId;
  },
});

import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAuthenticatedUser } from "./utils/auth";
import { assertValidMonth } from "./utils/validation";
import { getCategoriesMap, getLocationsMap } from "./utils/batchFetch";
import { computeMonthTotals } from "./utils/settlement";
import { creditAdjustmentsForMonth, isMonthSettled, storedAllocation } from "./utils/creditData";
import {
  HOUSEHOLD_BILLS_GROUP,
  creditBalance,
  planAutoAllocations,
  toPence,
  type CandidateCredit,
} from "./utils/credit";
import { householdDisplayName } from "./utils/settlementPlan";

export const getMonthData = query({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    assertValidMonth(args.month, "month");

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_month", (q) => q.eq("month", args.month))
      .collect();

    // Batch fetch all related data and users
    const [categoriesMap, locationsMap, users, credit, credits, allAllocations, monthSettled] =
      await Promise.all([
        getCategoriesMap(ctx),
        getLocationsMap(ctx),
        ctx.db.query("users").order("asc").collect(),
        creditAdjustmentsForMonth(ctx, args.month),
        ctx.db.query("credits").withIndex("by_received_on").collect(),
        ctx.db.query("creditAllocations").collect(),
        isMonthSettled(ctx, args.month),
      ]);

    const user1 = users[0] ?? null;
    const user2 = users[1] ?? null;
    const user1Name = user1?.username || user1?.name || "User 1";
    const user2Name = user2?.username || user2?.name || "User 2";
    const creditsById = new Map(credits.map((row) => [row._id as string, row]));
    const creditLabel = (id: string) => creditsById.get(id)?.description?.trim() || "Refund credit";

    const usesByExpense = new Map<
      string,
      { allocationId: string; creditId: string; label: string; amount: number }[]
    >();
    for (const allocation of credit.allocations) {
      if (!allocation.expenseId) continue;
      const uses = usesByExpense.get(allocation.expenseId) ?? [];
      uses.push({
        allocationId: allocation._id,
        creditId: allocation.creditId,
        label: creditLabel(allocation.creditId),
        amount: allocation.amount,
      });
      usesByExpense.set(allocation.expenseId, uses);
    }

    const openCredits: CandidateCredit[] = credits
      .filter((row) => row.closedAt === undefined)
      .map((row) => ({
        id: row._id,
        amountPence: toPence(row.amount),
        receivedOn: row.receivedOn,
        closed: false,
        allocatedPence: creditBalance(
          toPence(row.amount),
          allAllocations.filter((allocation) => allocation.creditId === row._id).map(storedAllocation),
        ).allocatedPence,
        holderInHousehold: row.holderId === user1?._id || row.holderId === user2?._id,
      }));

    const mappedExpenses = expenses.map((exp) => {
      const category = categoriesMap.get(exp.categoryId);
      const location = locationsMap.get(exp.locationId);
      const creditUses = usesByExpense.get(exp._id) ?? [];
      const allocatedPence = creditUses.reduce((total, use) => total + toPence(use.amount), 0);
      const householdBill = category?.group === HOUSEHOLD_BILLS_GROUP;
      const creditAvailable =
        householdBill &&
        planAutoAllocations(
          openCredits,
          {
            pence: toPence(exp.amount),
            date: exp.date,
            month: exp.month,
            split: exp.splitType,
            inHouseholdBills: true,
            allocatedPence,
            monthSettled,
          },
          new Set(creditUses.map((use) => use.creditId)),
        ).length > 0;
      return {
        id: exp._id,
        amount: exp.amount,
        date: exp.date,
        category: category?.name ?? "Uncategorized",
        categoryId: exp.categoryId,
        location: location?.name ?? "Unknown",
        locationId: exp.locationId,
        description: exp.description ?? "",
        paidBy: exp.paidById,
        split: exp.splitType,
        linkedDocumentIds: exp.linkedDocumentIds,
        creditApplied: allocatedPence / 100,
        creditUses,
        creditAvailable,
        householdBill,
      };
    });

    mappedExpenses.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const totals = computeMonthTotals(
      mappedExpenses,
      user1?._id ?? null,
      user2?._id ?? null,
      credit.adjustments,
    );

    const nameOf = (id: string) =>
      id === user1?._id
        ? householdDisplayName(user1, "User 1")
        : id === user2?._id
          ? householdDisplayName(user2, "User 2")
          : "Someone";
    const expenseById = new Map(expenses.map((exp) => [exp._id as string, exp]));
    const creditLines = credit.allocations.map((allocation) => {
      const holderId = creditsById.get(allocation.creditId)?.holderId ?? "";
      const otherId = holderId === user1?._id ? user2?._id : user1?._id;
      return {
        allocationId: allocation._id,
        creditId: allocation.creditId,
        label: creditLabel(allocation.creditId),
        kind: allocation.kind === "payout" ? ("payout" as const) : ("bill" as const),
        expenseId: allocation.expenseId ?? null,
        expenseDescription: allocation.expenseId
          ? expenseById.get(allocation.expenseId)?.description || "Bill"
          : null,
        holderName: nameOf(holderId),
        otherName: otherId ? nameOf(otherId) : "the other person",
        amount: allocation.amount,
        adjustment: allocation.adjustment,
        automatic: allocation.automatic === true,
      };
    });

    return {
      totalExpenses: totals.totalExpenses,
      fairShare: totals.fairShare,
      settlement: totals.settlement,
      settlementDirection: totals.settlementDirection,
      user1Paid: totals.user1Paid,
      user2Paid: totals.user2Paid,
      user1Name,
      user2Name,
      user1Id: user1?._id ?? null,
      user2Id: user2?._id ?? null,
      expenses: mappedExpenses,
      sharedExpensesTotal: totals.sharedExpensesTotal,
      eachPersonsShare: totals.eachPersonsShare,
      user1PersonalExpenses: totals.user1PersonalExpenses,
      user2PersonalExpenses: totals.user2PersonalExpenses,
      creditApplied: totals.creditApplied,
      creditAdjustment: totals.creditAdjustment,
      creditLines,
      monthSettled,
    };
  },
});

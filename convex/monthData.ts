import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAuthenticatedUser } from "./utils/auth";
import { assertValidMonth } from "./utils/validation";
import { getCategoriesMap, getLocationsMap } from "./utils/batchFetch";
import { computeMonthTotals } from "./utils/settlement";

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
    const [categoriesMap, locationsMap, users] = await Promise.all([
      getCategoriesMap(ctx),
      getLocationsMap(ctx),
      ctx.db.query("users").order("asc").collect(),
    ]);

    const mappedExpenses = expenses.map((exp) => {
      const category = categoriesMap.get(exp.categoryId);
      const location = locationsMap.get(exp.locationId);
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
      };
    });

    mappedExpenses.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const user1 = users[0] ?? null;
    const user2 = users[1] ?? null;

    const totals = computeMonthTotals(
      mappedExpenses,
      user1?._id ?? null,
      user2?._id ?? null,
    );

    return {
      totalExpenses: totals.totalExpenses,
      fairShare: totals.fairShare,
      settlement: totals.settlement,
      settlementDirection: totals.settlementDirection,
      user1Paid: totals.user1Paid,
      user2Paid: totals.user2Paid,
      user1Name: user1?.username ?? "User 1",
      user2Name: user2?.username ?? "User 2",
      user1Id: user1?._id ?? null,
      user2Id: user2?._id ?? null,
      expenses: mappedExpenses,
      sharedExpensesTotal: totals.sharedExpensesTotal,
      eachPersonsShare: totals.eachPersonsShare,
      user1PersonalExpenses: totals.user1PersonalExpenses,
      user2PersonalExpenses: totals.user2PersonalExpenses,
    };
  },
});

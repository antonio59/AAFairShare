import { v } from "convex/values";
import { query } from "./_generated/server";

export const getMonthData = query({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_month", (q) => q.eq("month", args.month))
      .collect();

    const users = await ctx.db.query("users").collect();

    const mappedExpenses = await Promise.all(
      expenses.map(async (exp) => {
        const category = await ctx.db.get(exp.categoryId);
        const location = await ctx.db.get(exp.locationId);
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
        };
      })
    );

    mappedExpenses.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const totalExpenses = parseFloat(
      mappedExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)
    );

    const user1 = users[0] ?? null;
    const user2 = users[1] ?? null;

    let user1Paid = 0;
    let user2Paid = 0;
    let user1Share = 0;
    let user2Share = 0;

    mappedExpenses.forEach((expense) => {
      if (user1 && expense.paidBy === user1._id) {
        user1Paid += expense.amount;
      } else if (user2 && expense.paidBy === user2._id) {
        user2Paid += expense.amount;
      }

      if (expense.split === "50/50") {
        user1Share += expense.amount / 2;
        user2Share += expense.amount / 2;
      } else if (expense.split === "custom" || expense.split === "100%") {
        if (user1 && expense.paidBy === user1._id) {
          user2Share += expense.amount;
        } else if (user2 && expense.paidBy === user2._id) {
          user1Share += expense.amount;
        }
      }
    });

    user1Paid = parseFloat(user1Paid.toFixed(2));
    user2Paid = parseFloat(user2Paid.toFixed(2));
    user1Share = parseFloat(user1Share.toFixed(2));
    user2Share = parseFloat(user2Share.toFixed(2));

    const user1Owes = parseFloat((user1Share - user1Paid).toFixed(2));
    const settlement = parseFloat(Math.abs(user1Owes).toFixed(2));
    let settlementDirection: "owes" | "owed" | "even" = "even";

    if (user1Owes > 0) {
      settlementDirection = "owes";
    } else if (user1Owes < 0) {
      settlementDirection = "owed";
    }

    return {
      totalExpenses,
      fairShare: parseFloat((totalExpenses / 2).toFixed(2)),
      settlement,
      settlementDirection,
      user1Paid,
      user2Paid,
      user1Name: user1?.username ?? "User 1",
      user2Name: user2?.username ?? "User 2",
      user1Id: user1?._id ?? null,
      user2Id: user2?._id ?? null,
      expenses: mappedExpenses,
    };
  },
});

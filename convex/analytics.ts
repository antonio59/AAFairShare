import { v } from "convex/values";
import { query } from "./_generated/server";

export const getLocationSpending = query({
  args: { 
    locationName: v.string(),
    startDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const location = await ctx.db
      .query("locations")
      .withIndex("by_name", (q) => q.eq("name", args.locationName))
      .first();

    if (!location) {
      return { total: 0, count: 0, average: 0, periodTotal: 0, periodCount: 0 };
    }

    let expenses = await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("locationId"), location._id))
      .collect();

    if (args.startDate) {
      expenses = expenses.filter((e) => e.date >= args.startDate!);
    }

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const count = expenses.length;
    const average = count > 0 ? total / count : 0;

    // Get period total for percentage calculation
    let allExpenses = await ctx.db.query("expenses").collect();
    if (args.startDate) {
      allExpenses = allExpenses.filter((e) => e.date >= args.startDate!);
    }
    const periodTotal = allExpenses.reduce((sum, e) => sum + e.amount, 0);

    return { total, count, average, periodTotal, periodCount: allExpenses.length };
  },
});

export const getCategorySpending = query({
  args: { 
    categoryName: v.string(),
    startDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query("categories")
      .withIndex("by_name", (q) => q.eq("name", args.categoryName))
      .first();

    if (!category) {
      return { total: 0, count: 0, average: 0, periodTotal: 0, periodCount: 0 };
    }

    let expenses = await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("categoryId"), category._id))
      .collect();

    if (args.startDate) {
      expenses = expenses.filter((e) => e.date >= args.startDate!);
    }

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const count = expenses.length;
    const average = count > 0 ? total / count : 0;

    let allExpenses = await ctx.db.query("expenses").collect();
    if (args.startDate) {
      allExpenses = allExpenses.filter((e) => e.date >= args.startDate!);
    }
    const periodTotal = allExpenses.reduce((sum, e) => sum + e.amount, 0);

    return { total, count, average, periodTotal, periodCount: allExpenses.length };
  },
});

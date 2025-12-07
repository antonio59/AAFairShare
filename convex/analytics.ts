import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAuthenticatedUser } from "./utils/auth";
import { assertValidDate } from "./utils/validation";

export const getLocationSpending = query({
  args: { 
    locationName: v.string(),
    startDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    if (args.startDate) {
      assertValidDate(args.startDate, "startDate");
    }

    const location = await ctx.db
      .query("locations")
      .withIndex("by_name", (q) => q.eq("name", args.locationName))
      .first();

    if (!location) {
      return { total: 0, count: 0, average: 0, periodTotal: 0, periodCount: 0 };
    }

    let expenses = await ctx.db
      .query("expenses")
      .withIndex("by_location", (q) => q.eq("locationId", location._id))
      .collect();

    if (args.startDate) {
      expenses = expenses.filter((e) => e.date >= args.startDate!);
    }

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const count = expenses.length;
    const average = count > 0 ? total / count : 0;

    // Get period total for percentage calculation
    const allExpenses = args.startDate
      ? await ctx.db
          .query("expenses")
          .withIndex("by_date", (q) => q.gte("date", args.startDate!))
          .collect()
      : await ctx.db.query("expenses").collect();
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
    await requireAuthenticatedUser(ctx);
    if (args.startDate) {
      assertValidDate(args.startDate, "startDate");
    }

    const category = await ctx.db
      .query("categories")
      .withIndex("by_name", (q) => q.eq("name", args.categoryName))
      .first();

    if (!category) {
      return { total: 0, count: 0, average: 0, periodTotal: 0, periodCount: 0 };
    }

    let expenses = await ctx.db
      .query("expenses")
      .withIndex("by_category", (q) => q.eq("categoryId", category._id))
      .collect();

    if (args.startDate) {
      expenses = expenses.filter((e) => e.date >= args.startDate!);
    }

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const count = expenses.length;
    const average = count > 0 ? total / count : 0;

    const allExpenses = args.startDate
      ? await ctx.db
          .query("expenses")
          .withIndex("by_date", (q) => q.gte("date", args.startDate!))
          .collect()
      : await ctx.db.query("expenses").collect();
    const periodTotal = allExpenses.reduce((sum, e) => sum + e.amount, 0);

    return { total, count, average, periodTotal, periodCount: allExpenses.length };
  },
});

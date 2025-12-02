import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByMonth = query({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_month", (q) => q.eq("month", args.month))
      .collect();

    const expensesWithDetails = await Promise.all(
      expenses.map(async (expense) => {
        const category = await ctx.db.get(expense.categoryId);
        const location = await ctx.db.get(expense.locationId);
        const paidBy = await ctx.db.get(expense.paidById);
        return {
          ...expense,
          category: category?.name ?? "Uncategorized",
          location: location?.name ?? "Unknown",
          paidByUser: paidBy,
        };
      })
    );

    return expensesWithDetails.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },
});

export const getById = query({
  args: { id: v.id("expenses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    amount: v.number(),
    date: v.string(),
    month: v.string(),
    description: v.optional(v.string()),
    paidById: v.id("users"),
    categoryId: v.id("categories"),
    locationId: v.id("locations"),
    splitType: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("expenses", {
      amount: args.amount,
      date: args.date,
      month: args.month,
      description: args.description,
      paidById: args.paidById,
      categoryId: args.categoryId,
      locationId: args.locationId,
      splitType: args.splitType,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("expenses"),
    amount: v.optional(v.number()),
    date: v.optional(v.string()),
    month: v.optional(v.string()),
    description: v.optional(v.string()),
    paidById: v.optional(v.id("users")),
    categoryId: v.optional(v.id("categories")),
    locationId: v.optional(v.id("locations")),
    splitType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );
    await ctx.db.patch(id, filteredUpdates);
  },
});

export const remove = mutation({
  args: { id: v.id("expenses") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const addWithLookup = mutation({
  args: {
    amount: v.number(),
    date: v.string(),
    description: v.optional(v.string()),
    paidById: v.id("users"),
    categoryName: v.string(),
    locationName: v.string(),
    splitType: v.string(),
  },
  handler: async (ctx, args) => {
    let category = await ctx.db
      .query("categories")
      .withIndex("by_name", (q) => q.eq("name", args.categoryName))
      .first();

    if (!category) {
      const categoryId = await ctx.db.insert("categories", {
        name: args.categoryName,
      });
      category = await ctx.db.get(categoryId);
    }

    let location = await ctx.db
      .query("locations")
      .withIndex("by_name", (q) => q.eq("name", args.locationName))
      .first();

    if (!location) {
      const locationId = await ctx.db.insert("locations", {
        name: args.locationName,
      });
      location = await ctx.db.get(locationId);
    }

    const dateObj = new Date(args.date);
    const month = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;

    const normalizedSplitType = args.splitType === "100%" ? "custom" : args.splitType;

    return await ctx.db.insert("expenses", {
      amount: args.amount,
      date: args.date,
      month: month,
      description: args.description,
      paidById: args.paidById,
      categoryId: category!._id,
      locationId: location!._id,
      splitType: normalizedSplitType,
    });
  },
});

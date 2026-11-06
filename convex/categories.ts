import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthenticatedUser } from "./utils/auth";
import { assertValidCategoryGroup } from "./utils/validation";
import { HOUSEHOLD_BILLS_GROUP } from "./utils/credit";
import { isMonthSettled } from "./utils/creditData";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);
    return await ctx.db.query("categories").collect();
  },
});

export const getById = query({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    return await ctx.db.get(args.id);
  },
});

export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    return await ctx.db
      .query("categories")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("categories", {
      name: args.name,
      icon: args.icon,
      color: args.color,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    
    await ctx.db.delete(args.id);
  },
});

export const getOrCreate = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("categories", {
      name: args.name,
    });
  },
});

export const setGroup = mutation({
  args: { id: v.id("categories"), group: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    if (args.group !== undefined) assertValidCategoryGroup(args.group);

    const category = await ctx.db.get(args.id);
    if (!category) throw new Error("Category not found");
    if (category.group === args.group) return;

    if (category.group === HOUSEHOLD_BILLS_GROUP) {
      const expenses = await ctx.db
        .query("expenses")
        .withIndex("by_category", (q) => q.eq("categoryId", args.id))
        .collect();
      for (const expense of expenses) {
        const used = await ctx.db
          .query("creditAllocations")
          .withIndex("by_expense", (q) => q.eq("expenseId", expense._id))
          .first();
        if (used && !(await isMonthSettled(ctx, expense.month))) {
          throw new Error(
            "Unsettled bills in this category use refund credit. Release that credit first.",
          );
        }
      }
    }

    await ctx.db.patch(args.id, { group: args.group });
  },
});

export const checkUsage = query({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const category = await ctx.db.get(args.id);
    if (!category) return false;

    const expenseUsage = await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("categoryId"), args.id))
      .first();

    if (expenseUsage) return true;

    const recurringUsage = await ctx.db
      .query("recurring")
      .filter((q) => q.eq(q.field("categoryId"), args.id))
      .first();

    return recurringUsage !== null;
  },
});

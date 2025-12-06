import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

// Migration-only mutation to create users directly
export const createUser = internalMutation({
  args: {
    email: v.string(),
    username: v.string(),
    photoUrl: v.optional(v.string()),
    oldId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      email: args.email,
      username: args.username,
      photoUrl: args.photoUrl,
      tokenIdentifier: `migration:${args.oldId}`,
    });
  },
});

// Migration-only mutation to create expenses with all IDs
export const createExpense = internalMutation({
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
    return await ctx.db.insert("expenses", args);
  },
});

// Migration-only mutation for settlements
export const createSettlement = internalMutation({
  args: {
    month: v.string(),
    date: v.string(),
    amount: v.number(),
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    status: v.string(),
    recordedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("settlements", args);
  },
});

// Migration-only mutation for recurring
export const createRecurring = internalMutation({
  args: {
    amount: v.number(),
    nextDueDate: v.string(),
    endDate: v.optional(v.string()),
    frequency: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
    categoryId: v.id("categories"),
    locationId: v.id("locations"),
    splitType: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("recurring", args);
  },
});

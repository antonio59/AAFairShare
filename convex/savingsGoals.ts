import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("savingsGoals").order("desc").collect();
  },
});

export const getById = query({
  args: { id: v.id("savingsGoals") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    targetAmount: v.number(),
    icon: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("savingsGoals", {
      name: args.name,
      targetAmount: args.targetAmount,
      currentAmount: 0,
      icon: args.icon,
      isCompleted: false,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("savingsGoals"),
    name: v.optional(v.string()),
    targetAmount: v.optional(v.number()),
    currentAmount: v.optional(v.number()),
    icon: v.optional(v.string()),
    isCompleted: v.optional(v.boolean()),
    completedAt: v.optional(v.string()),
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
  args: { id: v.id("savingsGoals") },
  handler: async (ctx, args) => {
    const contributions = await ctx.db
      .query("savingsContributions")
      .withIndex("by_goal", (q) => q.eq("goalId", args.id))
      .collect();

    for (const contribution of contributions) {
      await ctx.db.delete(contribution._id);
    }

    await ctx.db.delete(args.id);
  },
});

export const markComplete = mutation({
  args: { id: v.id("savingsGoals") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isCompleted: true,
      completedAt: new Date().toISOString(),
    });
  },
});

export const reopen = mutation({
  args: { id: v.id("savingsGoals") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isCompleted: false,
      completedAt: undefined,
    });
  },
});

export const addContribution = mutation({
  args: {
    goalId: v.id("savingsGoals"),
    amount: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const halfAmount = args.amount / 2;

    await ctx.db.insert("savingsContributions", {
      goalId: args.goalId,
      amount: args.amount,
      user1Contribution: halfAmount,
      user2Contribution: halfAmount,
      date: new Date().toISOString(),
      note: args.note,
    });

    const goal = await ctx.db.get(args.goalId);
    if (goal) {
      await ctx.db.patch(args.goalId, {
        currentAmount: goal.currentAmount + args.amount,
      });
    }

    return args.goalId;
  },
});

export const getContributions = query({
  args: { goalId: v.id("savingsGoals") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("savingsContributions")
      .withIndex("by_goal", (q) => q.eq("goalId", args.goalId))
      .collect();
  },
});

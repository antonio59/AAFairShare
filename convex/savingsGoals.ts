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
    contributorId: v.id("users"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("savingsContributions", {
      goalId: args.goalId,
      amount: args.amount,
      contributorId: args.contributorId,
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
    const contributions = await ctx.db
      .query("savingsContributions")
      .withIndex("by_goal", (q) => q.eq("goalId", args.goalId))
      .collect();

    // Enrich with contributor info
    const enrichedContributions = await Promise.all(
      contributions.map(async (c) => {
        const contributor = c.contributorId ? await ctx.db.get(c.contributorId) : null;
        return {
          ...c,
          contributorName: contributor?.username || contributor?.name || "Unknown",
          contributorImage: contributor?.image || "",
        };
      })
    );

    return enrichedContributions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },
});

export const getContributionsByUser = query({
  args: { goalId: v.id("savingsGoals") },
  handler: async (ctx, args) => {
    const contributions = await ctx.db
      .query("savingsContributions")
      .withIndex("by_goal", (q) => q.eq("goalId", args.goalId))
      .collect();

    const users = await ctx.db.query("users").collect();
    
    // Calculate totals per user
    const userTotals: Record<string, { 
      id: string; 
      name: string; 
      image: string; 
      total: number; 
    }> = {};

    for (const user of users) {
      userTotals[user._id] = {
        id: user._id,
        name: user.username || user.name || "Unknown",
        image: user.image || "",
        total: 0,
      };
    }

    for (const contribution of contributions) {
      if (contribution.contributorId && userTotals[contribution.contributorId]) {
        userTotals[contribution.contributorId].total += contribution.amount;
      }
    }

    return Object.values(userTotals);
  },
});

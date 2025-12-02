import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

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
    targetDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("savingsGoals", {
      name: args.name,
      targetAmount: args.targetAmount,
      currentAmount: 0,
      icon: args.icon,
      targetDate: args.targetDate,
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
    targetDate: v.optional(v.string()),
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
    const completedAt = new Date().toISOString();
    
    await ctx.db.patch(args.id, {
      isCompleted: true,
      completedAt,
    });

    // Get goal details for email
    const goal = await ctx.db.get(args.id);
    if (!goal) return;

    // Get all users
    const users = await ctx.db.query("users").collect();
    
    // Get contributions and calculate per-user totals
    const contributions = await ctx.db
      .query("savingsContributions")
      .withIndex("by_goal", (q) => q.eq("goalId", args.id))
      .collect();

    const userTotals: Record<string, number> = {};
    for (const user of users) {
      userTotals[user._id] = 0;
    }
    for (const contribution of contributions) {
      if (contribution.contributorId && userTotals[contribution.contributorId] !== undefined) {
        userTotals[contribution.contributorId] += contribution.amount;
      }
    }

    // Build contribution breakdown for email
    const contributionBreakdown = users.map(user => ({
      userName: user.username || user.name || "Unknown",
      amount: userTotals[user._id] || 0,
    }));

    // Build recipients list
    const recipients = users
      .filter(user => user.email)
      .map(user => ({
        email: user.email!,
        name: user.username || user.name || "User",
      }));

    // Schedule celebration email
    if (recipients.length > 0) {
      await ctx.scheduler.runAfter(0, internal.email.sendGoalCompletionEmailInternal, {
        goalName: goal.name,
        goalIcon: goal.icon,
        targetAmount: goal.targetAmount,
        totalSaved: goal.currentAmount,
        completedAt,
        contributions: contributionBreakdown,
        recipients,
      });
    }
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

export const updateContribution = mutation({
  args: {
    id: v.id("savingsContributions"),
    amount: v.optional(v.number()),
    contributorId: v.optional(v.id("users")),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const contribution = await ctx.db.get(args.id);
    if (!contribution) throw new Error("Contribution not found");

    const oldAmount = contribution.amount;
    const newAmount = args.amount ?? oldAmount;
    const amountDiff = newAmount - oldAmount;

    // Update the contribution
    await ctx.db.patch(args.id, {
      ...(args.amount !== undefined && { amount: args.amount }),
      ...(args.contributorId !== undefined && { contributorId: args.contributorId }),
      ...(args.note !== undefined && { note: args.note }),
    });

    // Update the goal's currentAmount if amount changed
    if (amountDiff !== 0) {
      const goal = await ctx.db.get(contribution.goalId);
      if (goal) {
        await ctx.db.patch(contribution.goalId, {
          currentAmount: goal.currentAmount + amountDiff,
        });
      }
    }
  },
});

export const deleteContribution = mutation({
  args: { id: v.id("savingsContributions") },
  handler: async (ctx, args) => {
    const contribution = await ctx.db.get(args.id);
    if (!contribution) throw new Error("Contribution not found");

    // Update the goal's currentAmount
    const goal = await ctx.db.get(contribution.goalId);
    if (goal) {
      await ctx.db.patch(contribution.goalId, {
        currentAmount: Math.max(0, goal.currentAmount - contribution.amount),
      });
    }

    await ctx.db.delete(args.id);
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

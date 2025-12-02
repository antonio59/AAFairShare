import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByMonth = query({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("settlements")
      .withIndex("by_month", (q) => q.eq("month", args.month))
      .first();
  },
});

export const checkExists = query({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    const settlement = await ctx.db
      .query("settlements")
      .withIndex("by_month", (q) => q.eq("month", args.month))
      .first();
    return settlement !== null;
  },
});

export const markComplete = mutation({
  args: {
    month: v.string(),
    date: v.string(),
    amount: v.number(),
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("settlements", {
      month: args.month,
      date: args.date,
      amount: parseFloat(args.amount.toFixed(2)),
      fromUserId: args.fromUserId,
      toUserId: args.toUserId,
      status: "completed",
      recordedBy: args.fromUserId,
    });
  },
});

export const markUnsettled = mutation({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    const settlement = await ctx.db
      .query("settlements")
      .withIndex("by_month", (q) => q.eq("month", args.month))
      .first();

    if (settlement) {
      await ctx.db.delete(settlement._id);
    }
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("settlements").collect();
  },
});

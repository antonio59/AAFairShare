import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAuthenticatedUser } from "./utils/auth";
import { assertPositiveAmount, assertValidMonth } from "./utils/validation";

export const getByMonth = query({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    assertValidMonth(args.month, "month");

    return await ctx.db
      .query("settlements")
      .withIndex("by_month", (q) => q.eq("month", args.month))
      .first();
  },
});

export const checkExists = query({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    assertValidMonth(args.month, "month");

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
    sendEmail: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);
    assertValidMonth(args.month, "month");
    assertPositiveAmount(args.amount, "amount");
    
    const settlementId = await ctx.db.insert("settlements", {
      month: args.month,
      date: args.date,
      amount: parseFloat(args.amount.toFixed(2)),
      fromUserId: args.fromUserId,
      toUserId: args.toUserId,
      status: "completed",
      recordedBy: userId,
    });

    // Schedule email notification
    if (args.sendEmail !== false) {
      await ctx.scheduler.runAfter(0, internal.settlements.sendSettlementNotification, {
        settlementId,
        fromUserId: args.fromUserId,
        toUserId: args.toUserId,
        amount: args.amount,
        month: args.month,
      });
    }

    return settlementId;
  },
});

export const sendSettlementNotification = internalMutation({
  args: {
    settlementId: v.id("settlements"),
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    amount: v.number(),
    month: v.string(),
  },
  handler: async (ctx, args) => {
    const fromUser = await ctx.db.get(args.fromUserId);
    const toUser = await ctx.db.get(args.toUserId);

    if (!fromUser || !toUser) {
      console.error("Settlement notification failed: Users not found", {
        fromUserId: args.fromUserId,
        toUserId: args.toUserId,
        fromUserFound: !!fromUser,
        toUserFound: !!toUser,
      });
      return;
    }

    const toUserEmail = toUser.email;
    if (!toUserEmail) {
      console.error("Settlement notification skipped: Recipient has no email address", {
        toUserId: args.toUserId,
        toUserName: toUser.username || toUser.name,
      });
      return;
    }

    // Schedule the action to send the email
    await ctx.scheduler.runAfter(0, internal.email.sendSettlementEmailInternal, {
      fromUserEmail: fromUser.email || "",
      fromUserName: fromUser.username || fromUser.name || "User",
      toUserEmail: toUserEmail,
      toUserName: toUser.username || toUser.name || "User",
      amount: args.amount,
      month: args.month,
    });
  },
});

export const markUnsettled = mutation({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    assertValidMonth(args.month, "month");
    
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
    await requireAuthenticatedUser(ctx);
    return await ctx.db.query("settlements").order("desc").collect();
  },
});

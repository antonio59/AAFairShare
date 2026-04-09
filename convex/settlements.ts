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
    // Get the settlement to find who recorded it
    const settlement = await ctx.db.get(args.settlementId);
    if (!settlement) {
      console.error("Settlement notification failed: Settlement not found", {
        settlementId: args.settlementId,
      });
      return;
    }

    const fromUser = await ctx.db.get(args.fromUserId);
    const toUser = await ctx.db.get(args.toUserId);
    const recordedByUser = await ctx.db.get(settlement.recordedBy);

    if (!fromUser || !toUser) {
      console.error("Settlement notification failed: Users not found", {
        fromUserId: args.fromUserId,
        toUserId: args.toUserId,
        fromUserFound: !!fromUser,
        toUserFound: !!toUser,
      });
      return;
    }

    const fromUserName = fromUser.username || fromUser.name || "User";
    const toUserName = toUser.username || toUser.name || "User";
    const recordedByName = recordedByUser?.username || recordedByUser?.name || "Someone";

    // Get month data for breakdown
    const allExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_month", (q) => q.eq("month", args.month))
      .collect();

    let user1Paid = 0;
    let user2Paid = 0;
    let sharedExpensesTotal = 0;
    let user1PersonalExpenses = 0;
    let user2PersonalExpenses = 0;

    const users = await ctx.db.query("users").order("asc").collect();
    const user1Id = users[0]?._id;
    const user2Id = users[1]?._id;

    for (const expense of allExpenses) {
      const isUser1 = expense.paidById === user1Id;
      const isUser2 = expense.paidById === user2Id;

      if (isUser1) {
        user1Paid += expense.amount;
      } else if (isUser2) {
        user2Paid += expense.amount;
      }

      if (expense.splitType === "50/50") {
        sharedExpensesTotal += expense.amount;
      } else if (expense.splitType === "100%") {
        if (isUser1) {
          user1PersonalExpenses += expense.amount;
        } else if (isUser2) {
          user2PersonalExpenses += expense.amount;
        }
      }
    }

    const eachPersonsShare = sharedExpensesTotal / 2;

    // Send email to both users
    const emailData = {
      recordedByName,
      fromUserName,
      toUserName,
      amount: args.amount,
      month: args.month,
      user1Paid,
      user2Paid,
      sharedExpensesTotal,
      eachPersonsShare,
      user1PersonalExpenses,
      user2PersonalExpenses,
    };

    // Send to toUser (person who received payment)
    if (toUser.email) {
      await ctx.scheduler.runAfter(0, internal.email.sendSettlementEmailInternal, {
        ...emailData,
        recipientEmail: toUser.email,
        recipientName: toUserName,
      });
    } else {
      console.error("Settlement notification skipped: toUser has no email address", {
        toUserId: args.toUserId,
        toUserName: toUserName,
      });
    }

    // Send to fromUser (person who made payment)
    if (fromUser.email) {
      await ctx.scheduler.runAfter(0, internal.email.sendSettlementEmailInternal, {
        ...emailData,
        recipientEmail: fromUser.email,
        recipientName: fromUserName,
      });
    } else {
      console.error("Settlement notification skipped: fromUser has no email address", {
        fromUserId: args.fromUserId,
        fromUserName: fromUserName,
      });
    }
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

// Resend settlement email for a specific month (useful for retrying failed emails)
export const resendSettlementEmail = internalMutation({
  args: {
    month: v.string(),
  },
  handler: async (ctx, args) => {
    const settlement = await ctx.db
      .query("settlements")
      .withIndex("by_month", (q) => q.eq("month", args.month))
      .first();

    if (!settlement) {
      console.error("No settlement found for month:", args.month);
      return { success: false, error: "Settlement not found" };
    }

    // Re-trigger the email notification
    await ctx.scheduler.runAfter(0, internal.settlements.sendSettlementNotification, {
      settlementId: settlement._id,
      fromUserId: settlement.fromUserId,
      toUserId: settlement.toUserId,
      amount: settlement.amount,
      month: settlement.month,
    });

    console.log("Settlement email resent for month:", args.month);
    return { success: true };
  },
});

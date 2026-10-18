import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAuthenticatedUser } from "./utils/auth";
import { assertValidDate, assertValidMonth } from "./utils/validation";
import { recordActivity } from "./utils/activityLog";
import { getCategoriesMap } from "./utils/batchFetch";
import { computeMonthTotals } from "./utils/settlement";
import { buildSettlementEmail } from "./utils/settlementEmail";
import {
  headlineFor,
  householdDisplayName,
  netDirection,
  plannedSettlement,
  summariseUnsettledMonths,
} from "./utils/settlementPlan";

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
    assertValidDate(args.date, "date");

    // Prevent duplicate settlements for the same month (e.g. double-clicks)
    const existing = await ctx.db
      .query("settlements")
      .withIndex("by_month", (q) => q.eq("month", args.month))
      .first();
    if (existing) {
      throw new Error(
        `A settlement for ${args.month} already exists. Remove it before recording a new one.`,
      );
    }

    const users = await ctx.db.query("users").order("asc").collect();
    const user1 = users[0];
    const user2 = users[1];
    if (!user1 || !user2) {
      throw new Error("Two people are needed to record a settlement");
    }

    const monthExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_month", (q) => q.eq("month", args.month))
      .collect();
    const totals = computeMonthTotals(
      monthExpenses.map((expense) => ({
        amount: expense.amount,
        paidBy: expense.paidById,
        split: expense.splitType,
      })),
      user1._id,
      user2._id,
    );
    // The client still sends amount and direction. The stored row uses this instead.
    const planned = plannedSettlement(totals, user1._id, user2._id);

    const settlementId = await ctx.db.insert("settlements", {
      month: args.month,
      date: args.date,
      amount: planned.amount,
      fromUserId: planned.fromUserId,
      toUserId: planned.toUserId,
      status: "completed",
      recordedBy: userId,
    });

    await recordActivity(ctx, {
      action: "settlement.recorded",
      actorId: userId,
      amount: planned.amount,
      settlementId,
      month: args.month,
      fromUserId: planned.fromUserId,
      toUserId: planned.toUserId,
    });

    if (args.sendEmail !== false) {
      await ctx.scheduler.runAfter(0, internal.settlements.sendSettlementNotification, {
        settlementId,
      });
    }

    return settlementId;
  },
});

export const sendSettlementNotification = internalMutation({
  args: {
    settlementId: v.id("settlements"),
  },
  handler: async (ctx, args) => {
    const settlement = await ctx.db.get(args.settlementId);
    if (!settlement) {
      console.error("Settlement notification failed: Settlement not found", {
        settlementId: args.settlementId,
      });
      return;
    }

    const users = await ctx.db.query("users").order("asc").collect();
    const user1 = users[0];
    const user2 = users[1];
    if (!user1 || !user2) {
      console.error("Settlement notification failed: household needs two people");
      return;
    }

    const recordedByUser = await ctx.db.get(settlement.recordedBy);
    const fromUser = await ctx.db.get(settlement.fromUserId);
    const toUser = await ctx.db.get(settlement.toUserId);
    const user1Name = householdDisplayName(user1, "User 1");
    const user2Name = householdDisplayName(user2, "User 2");
    const nameById = new Map<string, string>([
      [user1._id, user1Name],
      [user2._id, user2Name],
    ]);

    const [expenses, categoriesMap, recurring, contributions] = await Promise.all([
      ctx.db
        .query("expenses")
        .withIndex("by_month", (q) => q.eq("month", settlement.month))
        .collect(),
      getCategoriesMap(ctx),
      ctx.db.query("recurring").collect(),
      ctx.db.query("savingsContributions").collect(),
    ]);

    const emailExpenses = expenses.map((expense) => ({
      date: expense.date,
      description: expense.description ?? "",
      category: categoriesMap.get(expense.categoryId)?.name ?? "Uncategorised",
      paidById: expense.paidById,
      paidByName: nameById.get(expense.paidById) ?? "Someone",
      amount: expense.amount,
      split: expense.splitType,
    }));

    const recurringBills = recurring
      .filter((bill) => bill.lastGeneratedDate?.startsWith(settlement.month))
      .map((bill) => ({
        description: bill.description ?? "",
        amount: bill.amount,
        paidByName: nameById.get(bill.userId) ?? "Someone",
        date: bill.lastGeneratedDate ?? settlement.month,
      }));

    const monthContributions = contributions.filter((contribution) =>
      contribution.date.startsWith(settlement.month),
    );
    const savingsContributions: {
      goalName: string;
      amount: number;
      contributorName: string;
      date: string;
    }[] = [];
    for (const contribution of monthContributions) {
      const goal = await ctx.db.get(contribution.goalId);
      const contributor = contribution.contributorId
        ? await ctx.db.get(contribution.contributorId)
        : null;
      savingsContributions.push({
        goalName: goal?.name ?? "Savings",
        amount: contribution.amount,
        contributorName: householdDisplayName(contributor, "Someone"),
        date: contribution.date,
      });
    }

    const recordedFromName = fromUser
      ? householdDisplayName(fromUser, "Someone")
      : nameById.get(settlement.fromUserId) ?? "Someone";
    const recordedToName = toUser
      ? householdDisplayName(toUser, "Someone")
      : nameById.get(settlement.toUserId) ?? "Someone";

    const recipients = [user1, user2].filter(
      (user, index, all) => user.email && all.findIndex((other) => other.email === user.email) === index,
    );
    if (recipients.length === 0) {
      console.error("Settlement notification skipped: nobody has an email address");
      return;
    }

    for (const recipient of recipients) {
      const email = buildSettlementEmail({
        month: settlement.month,
        user1: { id: user1._id, name: user1Name },
        user2: { id: user2._id, name: user2Name },
        expenses: emailExpenses,
        recurringBills,
        savingsContributions,
        recipientName: householdDisplayName(recipient, "there"),
        recordedByName: householdDisplayName(recordedByUser, "Someone"),
        recorded: {
          amount: settlement.amount,
          fromUserId: settlement.fromUserId,
          fromName: recordedFromName,
          toName: recordedToName,
        },
      });
      await ctx.scheduler.runAfter(0, internal.email.sendSettlementEmailInternal, {
        recipientEmail: recipient.email!,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });
    }
  },
});

export const markUnsettled = mutation({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);
    assertValidMonth(args.month, "month");

    const settlement = await ctx.db
      .query("settlements")
      .withIndex("by_month", (q) => q.eq("month", args.month))
      .first();

    if (settlement) {
      await recordActivity(ctx, {
        action: "settlement.removed",
        actorId: userId,
        amount: settlement.amount,
        settlementId: settlement._id,
        month: settlement.month,
        fromUserId: settlement.fromUserId,
        toUserId: settlement.toUserId,
      });
      await ctx.db.delete(settlement._id);
    }
  },
});

export const getOpenBalances = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);
    const [expenses, settlementRows, users] = await Promise.all([
      ctx.db.query("expenses").collect(),
      ctx.db.query("settlements").collect(),
      ctx.db.query("users").order("asc").collect(),
    ]);
    const user1 = users[0] ?? null;
    const user2 = users[1] ?? null;
    const user1Id = user1?._id ?? "";
    const user2Id = user2?._id ?? "";
    const user1Name = householdDisplayName(user1, "User 1");
    const user2Name = householdDisplayName(user2, "User 2");
    const settledMonths = new Set(settlementRows.map((row) => row.month));

    const byMonth = new Map<string, { amount: number; paidBy: string; split: string }[]>();
    for (const expense of expenses) {
      const rows = byMonth.get(expense.month) ?? [];
      rows.push({
        amount: expense.amount,
        paidBy: expense.paidById,
        split: expense.splitType,
      });
      byMonth.set(expense.month, rows);
    }

    const summary = summariseUnsettledMonths(
      [...byMonth.entries()].map(([month, rows]) => ({
        month,
        totals: computeMonthTotals(rows, user1Id || null, user2Id || null),
        settled: settledMonths.has(month),
      })),
    );
    const direction = netDirection(summary.netPence);
    const netAmount = Math.abs(summary.netPence) / 100;

    return {
      user1Name,
      user2Name,
      netAmount,
      netDirection: direction,
      headline: headlineFor(netAmount, direction, user1Name, user2Name),
      months: summary.months.map((month) => ({
        month: month.month,
        amount: month.amount,
        direction: month.direction,
        headline: headlineFor(month.amount, month.direction, user1Name, user2Name),
      })),
    };
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

    await ctx.scheduler.runAfter(0, internal.settlements.sendSettlementNotification, {
      settlementId: settlement._id,
    });

    console.log("Settlement email resent for month:", args.month);
    return { success: true };
  },
});

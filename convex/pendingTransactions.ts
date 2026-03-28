import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthenticatedUser } from "./utils/auth";

export const getPending = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);

    const pending = await ctx.db
      .query("pendingTransactions")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();

    // Enrich with category/location names
    const enriched = await Promise.all(
      pending.map(async (tx) => {
        const category = tx.suggestedCategoryId
          ? await ctx.db.get(tx.suggestedCategoryId)
          : null;
        const location = tx.suggestedLocationId
          ? await ctx.db.get(tx.suggestedLocationId)
          : null;
        const paidBy = tx.suggestedPaidById
          ? await ctx.db.get(tx.suggestedPaidById)
          : null;

        return {
          ...tx,
          suggestedCategory: category?.name,
          suggestedLocation: location?.name,
          suggestedPaidByName: paidBy?.name || paidBy?.email,
        };
      })
    );

    return enriched;
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);

    const pending = await ctx.db
      .query("pendingTransactions")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const totalAmount = pending.reduce((sum, tx) => sum + tx.amount, 0);

    return {
      count: pending.length,
      totalAmount,
    };
  },
});

export const create = mutation({
  args: {
    amount: v.number(),
    date: v.string(),
    merchantName: v.string(),
    description: v.optional(v.string()),
    source: v.string(),
    externalId: v.optional(v.string()),
    suggestedCategoryId: v.optional(v.id("categories")),
    suggestedLocationId: v.optional(v.id("locations")),
    suggestedPaidById: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Check for duplicate by externalId
    if (args.externalId) {
      const existing = await ctx.db
        .query("pendingTransactions")
        .withIndex("by_external_id", (q) => q.eq("externalId", args.externalId))
        .first();

      if (existing) {
        return existing._id;
      }
    }

    // Try to auto-categorize based on merchant mappings
    let categoryId = args.suggestedCategoryId;
    let locationId = args.suggestedLocationId;
    let isUtility = false;

    const mappings = await ctx.db.query("merchantMappings").collect();
    for (const mapping of mappings) {
      const pattern = mapping.merchantPattern.toLowerCase();
      const merchant = args.merchantName.toLowerCase();

      if (merchant.includes(pattern) || new RegExp(pattern).test(merchant)) {
        categoryId = mapping.categoryId;
        locationId = mapping.locationId || locationId;
        isUtility = mapping.isUtility;
        break;
      }
    }

    const txId = await ctx.db.insert("pendingTransactions", {
      amount: args.amount,
      date: args.date,
      merchantName: args.merchantName,
      description: args.description,
      source: args.source,
      externalId: args.externalId,
      suggestedCategoryId: categoryId,
      suggestedLocationId: locationId,
      suggestedPaidById: args.suggestedPaidById,
      status: "pending",
      createdAt: Date.now(),
    });

    // If it's a utility and we have full categorization, auto-approve
    if (isUtility && categoryId && locationId && args.suggestedPaidById) {
      // Auto-create the expense
      const [year, monthNum] = args.date.split("-");
      const month = `${year}-${monthNum}`;

      const expenseId = await ctx.db.insert("expenses", {
        amount: args.amount,
        date: args.date,
        month,
        description: args.description || args.merchantName,
        paidById: args.suggestedPaidById,
        categoryId,
        locationId,
        splitType: "50/50",
      });

      await ctx.db.patch(txId, {
        status: "approved",
        processedAt: Date.now(),
        expenseId,
      });
    }

    return txId;
  },
});

export const approve = mutation({
  args: {
    id: v.id("pendingTransactions"),
    amount: v.number(),
    date: v.string(),
    categoryId: v.id("categories"),
    locationId: v.id("locations"),
    paidById: v.id("users"),
    splitType: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);

    const tx = await ctx.db.get(args.id);
    if (!tx || tx.status !== "pending") {
      throw new Error("Transaction not found or already processed");
    }

    const [year, monthNum] = args.date.split("-");
    const month = `${year}-${monthNum}`;

    const expenseId = await ctx.db.insert("expenses", {
      amount: args.amount,
      date: args.date,
      month,
      description: args.description,
      paidById: args.paidById,
      categoryId: args.categoryId,
      locationId: args.locationId,
      splitType: args.splitType,
    });

    await ctx.db.patch(args.id, {
      status: "approved",
      processedAt: Date.now(),
      processedBy: userId,
      expenseId,
    });

    return expenseId;
  },
});

export const dismiss = mutation({
  args: {
    id: v.id("pendingTransactions"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);

    const tx = await ctx.db.get(args.id);
    if (!tx || tx.status !== "pending") {
      throw new Error("Transaction not found or already processed");
    }

    await ctx.db.patch(args.id, {
      status: "dismissed",
      processedAt: Date.now(),
      processedBy: userId,
    });
  },
});

export const dismissAll = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuthenticatedUser(ctx);

    const pending = await ctx.db
      .query("pendingTransactions")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    for (const tx of pending) {
      await ctx.db.patch(tx._id, {
        status: "dismissed",
        processedAt: Date.now(),
        processedBy: userId,
      });
    }

    return pending.length;
  },
});

// Bulk approve with same settings
export const approveAll = mutation({
  args: {
    paidById: v.id("users"),
    splitType: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);

    const pending = await ctx.db
      .query("pendingTransactions")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    let approved = 0;
    let skipped = 0;

    for (const tx of pending) {
      // Skip if missing category or location
      if (!tx.suggestedCategoryId || !tx.suggestedLocationId) {
        skipped++;
        continue;
      }

      const [year, monthNum] = tx.date.split("-");
      const month = `${year}-${monthNum}`;

      const expenseId = await ctx.db.insert("expenses", {
        amount: tx.amount,
        date: tx.date,
        month,
        description: tx.description || tx.merchantName,
        paidById: args.paidById,
        categoryId: tx.suggestedCategoryId,
        locationId: tx.suggestedLocationId,
        splitType: args.splitType,
      });

      await ctx.db.patch(tx._id, {
        status: "approved",
        processedAt: Date.now(),
        processedBy: userId,
        expenseId,
      });

      approved++;
    }

    return { approved, skipped };
  },
});

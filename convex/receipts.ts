import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getReceiptUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const attachReceipt = mutation({
  args: {
    expenseId: v.id("expenses"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.expenseId, {
      receiptId: args.storageId,
    });
  },
});

export const removeReceipt = mutation({
  args: {
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    const expense = await ctx.db.get(args.expenseId);
    if (expense?.receiptId) {
      await ctx.storage.delete(expense.receiptId);
    }
    await ctx.db.patch(args.expenseId, {
      receiptId: undefined,
    });
  },
});

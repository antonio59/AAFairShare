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

export const getAllWithReceipts = query({
  args: {},
  handler: async (ctx) => {
    const expenses = await ctx.db.query("expenses").collect();
    
    const expensesWithReceipts = await Promise.all(
      expenses
        .filter(exp => exp.receiptId)
        .map(async (expense) => {
          const category = await ctx.db.get(expense.categoryId);
          const location = await ctx.db.get(expense.locationId);
          const paidBy = await ctx.db.get(expense.paidById);
          const receiptUrl = expense.receiptId 
            ? await ctx.storage.getUrl(expense.receiptId) 
            : null;
          
          return {
            ...expense,
            type: "expense" as const,
            category: category?.name ?? "Uncategorized",
            location: location?.name ?? "Unknown",
            paidByName: paidBy?.username || paidBy?.name || "Unknown",
            paidByImage: paidBy?.image || "",
            receiptUrl,
          };
        })
    );

    return expensesWithReceipts.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },
});

// Standalone receipts
export const createStandalone = mutation({
  args: {
    storageId: v.id("_storage"),
    title: v.optional(v.string()),
    amount: v.optional(v.number()),
    date: v.string(),
    notes: v.optional(v.string()),
    uploadedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("receipts", {
      storageId: args.storageId,
      title: args.title,
      amount: args.amount,
      date: args.date,
      notes: args.notes,
      uploadedBy: args.uploadedBy,
    });
  },
});

export const updateStandalone = mutation({
  args: {
    id: v.id("receipts"),
    title: v.optional(v.string()),
    amount: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteStandalone = mutation({
  args: { id: v.id("receipts") },
  handler: async (ctx, args) => {
    const receipt = await ctx.db.get(args.id);
    if (receipt?.storageId) {
      await ctx.storage.delete(receipt.storageId);
    }
    await ctx.db.delete(args.id);
  },
});

export const getAllStandalone = query({
  args: {},
  handler: async (ctx) => {
    const receipts = await ctx.db.query("receipts").collect();
    
    const receiptsWithUrls = await Promise.all(
      receipts.map(async (receipt) => {
        const receiptUrl = await ctx.storage.getUrl(receipt.storageId);
        const uploadedBy = receipt.uploadedBy 
          ? await ctx.db.get(receipt.uploadedBy) 
          : null;
        
        return {
          ...receipt,
          type: "standalone" as const,
          receiptUrl,
          uploadedByName: uploadedBy?.username || uploadedBy?.name || "Unknown",
          uploadedByImage: uploadedBy?.image || "",
        };
      })
    );

    return receiptsWithUrls.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },
});

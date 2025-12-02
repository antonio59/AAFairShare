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

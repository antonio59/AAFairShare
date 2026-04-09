import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthenticatedUser } from "./utils/auth";
import { assertValidDate } from "./utils/validation";
import {
  getCategoriesMap,
  getLocationsMap,
  getUsersMap,
} from "./utils/batchFetch";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);

    return await ctx.storage.generateUploadUrl();
  },
});

export const getReceiptUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Legacy receipt attachment - creates a standalone receipt and links it
export const attachReceipt = mutation({
  args: {
    expenseId: v.id("expenses"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    // Create a receipt record and link it to the expense
    const receiptId = await ctx.db.insert("receipts", {
      storageId: args.storageId,
      date: new Date().toISOString().split("T")[0],
      linkedExpenseIds: [args.expenseId],
    });

    // Add receipt to expense's linked receipts
    const expense = await ctx.db.get(args.expenseId);
    const currentLinkedIds = expense?.linkedReceiptIds || [];
    await ctx.db.patch(args.expenseId, {
      linkedReceiptIds: [...currentLinkedIds, receiptId],
    });
  },
});

export const removeReceipt = mutation({
  args: {
    expenseId: v.id("expenses"),
    receiptId: v.id("receipts"),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const receipt = await ctx.db.get(args.receiptId);
    if (receipt?.storageId) {
      await ctx.storage.delete(receipt.storageId);
    }
    
    // Remove expense from receipt's linked expenses
    const linkedIds = receipt?.linkedExpenseIds || [];
    await ctx.db.patch(args.receiptId, {
      linkedExpenseIds: linkedIds.filter(id => id !== args.expenseId),
    });
    
    // Remove receipt from expense's linked receipts
    const expense = await ctx.db.get(args.expenseId);
    const expenseLinkedIds = expense?.linkedReceiptIds || [];
    await ctx.db.patch(args.expenseId, {
      linkedReceiptIds: expenseLinkedIds.filter(id => id !== args.receiptId),
    });
  },
});

export const getAllWithReceipts = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);

    // Get expenses that have linked receipts
    const expenses = await ctx.db.query("expenses").collect();
    const expensesWithReceipts = expenses.filter((exp) => 
      exp.linkedReceiptIds && exp.linkedReceiptIds.length > 0
    );

    // Batch fetch all related data
    const [categoriesMap, locationsMap, usersMap] = await Promise.all([
      getCategoriesMap(ctx),
      getLocationsMap(ctx),
      getUsersMap(ctx),
    ]);

    // For each expense, get the first linked receipt URL
    const receiptData = await Promise.all(
      expensesWithReceipts.map(async (exp) => {
        if (!exp.linkedReceiptIds?.length) return null;
        const receipt = await ctx.db.get(exp.linkedReceiptIds[0]);
        if (!receipt) return null;
        const url = await ctx.storage.getUrl(receipt.storageId);
        return { receipt, url };
      }),
    );

    const expensesWithReceiptDetails = expensesWithReceipts.map(
      (expense, index) => {
        const category = categoriesMap.get(expense.categoryId);
        const location = locationsMap.get(expense.locationId);
        const paidBy = usersMap.get(expense.paidById);
        const receiptInfo = receiptData[index];

        return {
          ...expense,
          type: "expense" as const,
          category: category?.name ?? "Uncategorized",
          location: location?.name ?? "Unknown",
          paidByName: paidBy?.username || paidBy?.name || "Unknown",
          paidByImage: paidBy?.image || "",
          receiptUrl: receiptInfo?.url || null,
        };
      },
    );

    return expensesWithReceiptDetails.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
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
    await requireAuthenticatedUser(ctx);
    assertValidDate(args.date, "date");

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
    await requireAuthenticatedUser(ctx);

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteStandalone = mutation({
  args: { id: v.id("receipts") },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

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
    await requireAuthenticatedUser(ctx);

    const receipts = await ctx.db.query("receipts").collect();

    // Batch fetch users and receipt URLs
    const usersMap = await getUsersMap(ctx);
    const receiptUrls = await Promise.all(
      receipts.map((receipt) => ctx.storage.getUrl(receipt.storageId)),
    );

    const receiptsWithUrls = receipts.map((receipt, index) => {
      const uploadedBy = receipt.uploadedBy
        ? usersMap.get(receipt.uploadedBy)
        : null;

      return {
        ...receipt,
        type: "standalone" as const,
        receiptUrl: receiptUrls[index],
        uploadedByName: uploadedBy?.username || uploadedBy?.name || "Unknown",
        uploadedByImage: uploadedBy?.image || "",
        linkedExpenseCount: (receipt.linkedExpenseIds || []).length,
      };
    });

    return receiptsWithUrls.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  },
});

// ============ RECEIPT LINKING ============

export const linkReceiptToExpense = mutation({
  args: {
    receiptId: v.id("receipts"),
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const receipt = await ctx.db.get(args.receiptId);
    const currentLinkedIds = receipt?.linkedExpenseIds || [];

    // Add expense to receipt's linked expenses (if not already there)
    if (!currentLinkedIds.includes(args.expenseId)) {
      await ctx.db.patch(args.receiptId, {
        linkedExpenseIds: [...currentLinkedIds, args.expenseId],
      });
    }

    // Add receipt to expense's linked receipts
    const expense = await ctx.db.get(args.expenseId);
    const expenseLinkedIds = expense?.linkedReceiptIds || [];
    if (!expenseLinkedIds.includes(args.receiptId)) {
      await ctx.db.patch(args.expenseId, {
        linkedReceiptIds: [...expenseLinkedIds, args.receiptId],
      });
    }

    return { success: true };
  },
});

export const unlinkReceiptFromExpense = mutation({
  args: {
    receiptId: v.id("receipts"),
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const receipt = await ctx.db.get(args.receiptId);
    const currentLinkedIds = receipt?.linkedExpenseIds || [];

    // Remove expense from receipt's linked expenses
    await ctx.db.patch(args.receiptId, {
      linkedExpenseIds: currentLinkedIds.filter(id => id !== args.expenseId),
    });

    // Remove receipt from expense's linked receipts
    const expense = await ctx.db.get(args.expenseId);
    const expenseLinkedIds = expense?.linkedReceiptIds || [];
    await ctx.db.patch(args.expenseId, {
      linkedReceiptIds: expenseLinkedIds.filter(id => id !== args.receiptId),
    });

    return { success: true };
  },
});

export const getReceiptWithExpenses = query({
  args: {
    receiptId: v.id("receipts"),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const receipt = await ctx.db.get(args.receiptId);
    if (!receipt) {
      return null;
    }

    const url = await ctx.storage.getUrl(receipt.storageId);
    const usersMap = await getUsersMap(ctx);
    const uploadedBy = receipt.uploadedBy ? usersMap.get(receipt.uploadedBy) : null;

    // Get linked expenses details
    const linkedExpenses = await Promise.all(
      (receipt.linkedExpenseIds || []).map(async (expId) => {
        const exp = await ctx.db.get(expId);
        if (!exp) return null;
        
        const [category, location, paidBy] = await Promise.all([
          ctx.db.get(exp.categoryId),
          ctx.db.get(exp.locationId),
          exp.paidById ? usersMap.get(exp.paidById) : null,
        ]);

        return {
          _id: exp._id,
          amount: exp.amount,
          date: exp.date,
          description: exp.description,
          category: category?.name || "Uncategorized",
          location: location?.name || "Unknown",
          paidByName: paidBy?.username || paidBy?.name || "Unknown",
        };
      })
    );

    return {
      ...receipt,
      url,
      uploadedByName: uploadedBy?.username || uploadedBy?.name || "Unknown",
      uploadedByImage: uploadedBy?.image || "",
      linkedExpenses: linkedExpenses.filter(Boolean),
    };
  },
});

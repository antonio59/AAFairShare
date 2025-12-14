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

export const attachReceipt = mutation({
  args: {
    expenseId: v.id("expenses"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

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
    await requireAuthenticatedUser(ctx);

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
    await requireAuthenticatedUser(ctx);

    const expenses = await ctx.db.query("expenses").collect();
    const expensesWithReceiptIds = expenses.filter((exp) => exp.receiptId);

    // Batch fetch all related data
    const [categoriesMap, locationsMap, usersMap] = await Promise.all([
      getCategoriesMap(ctx),
      getLocationsMap(ctx),
      getUsersMap(ctx),
    ]);

    // Fetch receipt URLs in parallel
    const receiptUrls = await Promise.all(
      expensesWithReceiptIds.map((exp) =>
        exp.receiptId
          ? ctx.storage.getUrl(exp.receiptId)
          : Promise.resolve(null),
      ),
    );

    const expensesWithReceipts = expensesWithReceiptIds.map(
      (expense, index) => {
        const category = categoriesMap.get(expense.categoryId);
        const location = locationsMap.get(expense.locationId);
        const paidBy = usersMap.get(expense.paidById);

        return {
          ...expense,
          type: "expense" as const,
          category: category?.name ?? "Uncategorized",
          location: location?.name ?? "Unknown",
          paidByName: paidBy?.username || paidBy?.name || "Unknown",
          paidByImage: paidBy?.image || "",
          receiptUrl: receiptUrls[index],
        };
      },
    );

    return expensesWithReceipts.sort(
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
      };
    });

    return receiptsWithUrls.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  },
});

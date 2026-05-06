import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthenticatedUser } from "./utils/auth";
import {
  assertPositiveAmount,
  assertValidDate,
  assertValidMonth,
  assertValidSplitType,
} from "./utils/validation";
import {
  getCategoriesMap,
  getLocationsMap,
  getUsersMap,
} from "./utils/batchFetch";

export const getByMonth = query({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    assertValidMonth(args.month, "month");

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_month", (q) => q.eq("month", args.month))
      .collect();

    // Batch fetch all related data
    const [categoriesMap, locationsMap, usersMap] = await Promise.all([
      getCategoriesMap(ctx),
      getLocationsMap(ctx),
      getUsersMap(ctx),
    ]);

    const expensesWithDetails = await Promise.all(
      expenses.map(async (expense) => {
        const category = categoriesMap.get(expense.categoryId);
        const location = locationsMap.get(expense.locationId);
        const paidBy = usersMap.get(expense.paidById);

        return {
          ...expense,
          category: category?.name ?? "Uncategorized",
          location: location?.name ?? "Unknown",
          paidByUser: paidBy,
        };
      }),
    );

    return expensesWithDetails.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  },
});

export const getById = query({
  args: { id: v.id("expenses") },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    return await ctx.db.get(args.id);
  },
});

export const getByMonthPaginated = query({
  args: {
    month: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    assertValidMonth(args.month, "month");

    const limit = args.limit ?? 50;

    const expenseQuery = ctx.db
      .query("expenses")
      .withIndex("by_month", (q) => q.eq("month", args.month));

    const results = await expenseQuery.paginate({
      numItems: limit,
      cursor: args.cursor ?? null,
    });

    // Batch fetch all related data
    const [categoriesMap, locationsMap, usersMap] = await Promise.all([
      getCategoriesMap(ctx),
      getLocationsMap(ctx),
      getUsersMap(ctx),
    ]);

    const expensesWithDetails = results.page.map((expense) => {
      const category = categoriesMap.get(expense.categoryId);
      const location = locationsMap.get(expense.locationId);
      const paidBy = usersMap.get(expense.paidById);
      return {
        ...expense,
        category: category?.name ?? "Uncategorized",
        location: location?.name ?? "Unknown",
        paidByUser: paidBy,
      };
    });

    // Sort by date descending
    expensesWithDetails.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return {
      expenses: expensesWithDetails,
      continueCursor: results.continueCursor,
      isDone: results.isDone,
    };
  },
});

export const create = mutation({
  args: {
    amount: v.number(),
    date: v.string(),
    month: v.string(),
    description: v.optional(v.string()),
    paidById: v.id("users"),
    categoryId: v.id("categories"),
    locationId: v.id("locations"),
    splitType: v.string(),
    linkedDocumentIds: v.optional(v.array(v.id("documents"))),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    assertPositiveAmount(args.amount, "amount");
    assertValidDate(args.date, "date");
    assertValidMonth(args.month, "month");
    assertValidSplitType(args.splitType, "splitType");

    const expenseId = await ctx.db.insert("expenses", {
      amount: args.amount,
      date: args.date,
      month: args.month,
      description: args.description,
      paidById: args.paidById,
      categoryId: args.categoryId,
      locationId: args.locationId,
      splitType: args.splitType,
      linkedDocumentIds: args.linkedDocumentIds,
    });

    // If linked to documents, add expense to each document's linked expenses array
    if (args.linkedDocumentIds) {
      for (const docId of args.linkedDocumentIds) {
        const doc = await ctx.db.get(docId);
        if (doc) {
          const currentLinkedIds = doc.linkedExpenseIds || [];
          if (!currentLinkedIds.includes(expenseId)) {
            await ctx.db.patch(docId, {
              linkedExpenseIds: [...currentLinkedIds, expenseId],
            });
          }
        }
      }
    }

    return expenseId;
  },
});

export const update = mutation({
  args: {
    id: v.id("expenses"),
    amount: v.optional(v.number()),
    date: v.optional(v.string()),
    month: v.optional(v.string()),
    description: v.optional(v.string()),
    paidById: v.optional(v.id("users")),
    categoryId: v.optional(v.id("categories")),
    locationId: v.optional(v.id("locations")),
    splitType: v.optional(v.string()),
    linkedDocumentIds: v.optional(v.array(v.id("documents"))),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const { id, ...updates } = args;

    // Get current expense to check for document link changes
    const currentExpense = await ctx.db.get(id);

    // Recalculate month if date is being updated
    if (updates.date) {
      assertValidDate(updates.date, "date");
      const [year, monthNum] = updates.date.split("-");
      updates.month = `${year}-${monthNum}`;
    }

    if (updates.month) {
      assertValidMonth(updates.month, "month");
    }

    if (updates.amount !== undefined) {
      assertPositiveAmount(updates.amount, "amount");
    }

    if (updates.splitType !== undefined) {
      assertValidSplitType(updates.splitType, "splitType");
    }

    // Handle document linking changes
    if ("linkedDocumentIds" in updates) {
      // Get current document IDs
      const currentDocIds = currentExpense?.linkedDocumentIds || [];
      const newDocIds = updates.linkedDocumentIds || [];

      // Find documents to unlink (in current but not in new)
      const toUnlink = currentDocIds.filter(
        (did) => !newDocIds.includes(did),
      );
      // Find documents to link (in new but not in current)
      const toLink = newDocIds.filter(
        (did) => !currentDocIds.includes(did),
      );

      // Unlink from old documents
      for (const docId of toUnlink) {
        const doc = await ctx.db.get(docId);
        if (doc) {
          const linkedIds = doc.linkedExpenseIds || [];
          await ctx.db.patch(docId, {
            linkedExpenseIds: linkedIds.filter((expId) => expId !== id),
          });
        }
      }

      // Link to new documents
      for (const docId of toLink) {
        const doc = await ctx.db.get(docId);
        if (doc) {
          const linkedIds = doc.linkedExpenseIds || [];
          if (!linkedIds.includes(id)) {
            await ctx.db.patch(docId, {
              linkedExpenseIds: [...linkedIds, id],
            });
          }
        }
      }
    }

    const { linkedDocumentIds, ...otherUpdates } = updates;
    const filteredOtherUpdates = Object.fromEntries(
      Object.entries(otherUpdates).filter(([, value]) => value !== undefined),
    );

    const patchData: Record<string, unknown> = { ...filteredOtherUpdates };
    if ("linkedDocumentIds" in updates) {
      patchData.linkedDocumentIds = linkedDocumentIds;
    }

    await ctx.db.patch(id, patchData);
  },
});

export const remove = mutation({
  args: { id: v.id("expenses") },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    // Get expense to check for linked documents
    const expense = await ctx.db.get(args.id);

    // If linked to documents, remove this expense from each document's linked expenses
    if (expense?.linkedDocumentIds) {
      for (const docId of expense.linkedDocumentIds) {
        const doc = await ctx.db.get(docId);
        if (doc) {
          const linkedIds = doc.linkedExpenseIds || [];
          await ctx.db.patch(docId, {
            linkedExpenseIds: linkedIds.filter((expId) => expId !== args.id),
          });
        }
      }
    }

    await ctx.db.delete(args.id);
  },
});

export const addWithLookup = mutation({
  args: {
    amount: v.number(),
    date: v.string(),
    description: v.optional(v.string()),
    paidById: v.id("users"),
    categoryName: v.string(),
    locationName: v.string(),
    splitType: v.string(),
    linkedDocumentIds: v.optional(v.array(v.id("documents"))),
    receiptStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    assertPositiveAmount(args.amount, "amount");
    assertValidDate(args.date, "date");

    let category = await ctx.db
      .query("categories")
      .withIndex("by_name", (q) => q.eq("name", args.categoryName))
      .first();

    if (!category) {
      const categoryId = await ctx.db.insert("categories", {
        name: args.categoryName,
      });
      category = await ctx.db.get(categoryId);
    }

    let location = await ctx.db
      .query("locations")
      .withIndex("by_name", (q) => q.eq("name", args.locationName))
      .first();

    if (!location) {
      const locationId = await ctx.db.insert("locations", {
        name: args.locationName,
      });
      location = await ctx.db.get(locationId);
    }

    const [year, monthNum] = args.date.split("-");
    const month = `${year}-${monthNum}`;
    assertValidMonth(month, "month");

    // Validate and normalize splitType
    const normalizedSplitType =
      args.splitType === "100%" ? "custom" : args.splitType;
    assertValidSplitType(normalizedSplitType, "splitType");

    const expenseId = await ctx.db.insert("expenses", {
      amount: args.amount,
      date: args.date,
      month: month,
      description: args.description,
      paidById: args.paidById,
      categoryId: category!._id,
      locationId: location!._id,
      splitType: normalizedSplitType,
      linkedDocumentIds: args.linkedDocumentIds,
    });

    let finalLinkedDocumentIds = args.linkedDocumentIds || [];

    if (args.receiptStorageId) {
      const documentId = await ctx.db.insert("documents", {
        storageId: args.receiptStorageId,
        type: "receipt",
        date: args.date,
        fileType: "image",
        uploadDate: new Date().toISOString().split("T")[0],
        linkedExpenseIds: [expenseId],
      });
      finalLinkedDocumentIds = [...finalLinkedDocumentIds, documentId];
      await ctx.db.patch(expenseId, {
        linkedDocumentIds: finalLinkedDocumentIds,
      });
    }

    // If linked to documents, add expense to each document's linked expenses array
    if (finalLinkedDocumentIds.length > 0) {
      for (const docId of finalLinkedDocumentIds) {
        const doc = await ctx.db.get(docId);
        if (doc) {
          const currentLinkedIds = doc.linkedExpenseIds || [];
          if (!currentLinkedIds.includes(expenseId)) {
            await ctx.db.patch(docId, {
              linkedExpenseIds: [...currentLinkedIds, expenseId],
            });
          }
        }
      }
    }

    return expenseId;
  },
});

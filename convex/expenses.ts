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

        // Fetch linked bill if exists
        let linkedBill = null;
        if (expense.linkedBillId) {
          const bill = await ctx.db.get(expense.linkedBillId);
          if (bill) {
            const address = await ctx.db.get(bill.addressId);
            const billUrl = await ctx.storage.getUrl(bill.storageId);
            linkedBill = {
              ...bill,
              url: billUrl,
              addressName: address?.name || "Unknown Address",
            };
          }
        }

        return {
          ...expense,
          category: category?.name ?? "Uncategorized",
          location: location?.name ?? "Unknown",
          paidByUser: paidBy,
          linkedBill,
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
    linkedBillId: v.optional(v.id("bills")),
    linkedReceiptIds: v.optional(v.array(v.id("receipts"))),
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
      linkedBillId: args.linkedBillId,
      linkedReceiptIds: args.linkedReceiptIds,
    });

    // If linked to a bill, add expense to bill's linked expenses array
    if (args.linkedBillId) {
      const bill = await ctx.db.get(args.linkedBillId);
      const currentLinkedIds = bill?.linkedExpenseIds || [];
      await ctx.db.patch(args.linkedBillId, {
        linkedExpenseIds: [...currentLinkedIds, expenseId],
      });
    }

    // If linked to receipts, add expense to each receipt's linked expenses array
    if (args.linkedReceiptIds) {
      for (const receiptId of args.linkedReceiptIds) {
        const receipt = await ctx.db.get(receiptId);
        if (receipt) {
          const currentLinkedIds = receipt.linkedExpenseIds || [];
          if (!currentLinkedIds.includes(expenseId)) {
            await ctx.db.patch(receiptId, {
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
    linkedBillId: v.optional(v.id("bills")),
    linkedReceiptIds: v.optional(v.array(v.id("receipts"))),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const { id, ...updates } = args;

    // Get current expense to check for bill link changes
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

    // Handle bill linking changes
    if (updates.linkedBillId !== undefined) {
      // Unlink from old bill if different
      if (
        currentExpense?.linkedBillId &&
        currentExpense.linkedBillId !== updates.linkedBillId
      ) {
        const oldBill = await ctx.db.get(currentExpense.linkedBillId);
        const oldLinkedIds = oldBill?.linkedExpenseIds || [];
        await ctx.db.patch(currentExpense.linkedBillId, {
          linkedExpenseIds: oldLinkedIds.filter((expId) => expId !== id),
        });
      }

      // Link to new bill
      if (updates.linkedBillId) {
        const newBill = await ctx.db.get(updates.linkedBillId);
        const newLinkedIds = newBill?.linkedExpenseIds || [];
        if (!newLinkedIds.includes(id)) {
          await ctx.db.patch(updates.linkedBillId, {
            linkedExpenseIds: [...newLinkedIds, id],
          });
        }
      }
    }

    // Handle receipt linking changes
    if (updates.linkedReceiptIds !== undefined) {
      // Get current receipt IDs
      const currentReceiptIds = currentExpense?.linkedReceiptIds || [];
      const newReceiptIds = updates.linkedReceiptIds || [];

      // Find receipts to unlink (in current but not in new)
      const toUnlink = currentReceiptIds.filter(
        (rid) => !newReceiptIds.includes(rid),
      );
      // Find receipts to link (in new but not in current)
      const toLink = newReceiptIds.filter(
        (rid) => !currentReceiptIds.includes(rid),
      );

      // Unlink from old receipts
      for (const receiptId of toUnlink) {
        const receipt = await ctx.db.get(receiptId);
        if (receipt) {
          const linkedIds = receipt.linkedExpenseIds || [];
          await ctx.db.patch(receiptId, {
            linkedExpenseIds: linkedIds.filter((expId) => expId !== id),
          });
        }
      }

      // Link to new receipts
      for (const receiptId of toLink) {
        const receipt = await ctx.db.get(receiptId);
        if (receipt) {
          const linkedIds = receipt.linkedExpenseIds || [];
          if (!linkedIds.includes(id)) {
            await ctx.db.patch(receiptId, {
              linkedExpenseIds: [...linkedIds, id],
            });
          }
        }
      }
    }

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined),
    );
    await ctx.db.patch(id, filteredUpdates);
  },
});

export const remove = mutation({
  args: { id: v.id("expenses") },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    // Get expense to check for linked bill and receipts
    const expense = await ctx.db.get(args.id);

    // If linked to a bill, remove this expense from bill's linked expenses
    if (expense?.linkedBillId) {
      const bill = await ctx.db.get(expense.linkedBillId);
      if (bill) {
        const linkedIds = bill.linkedExpenseIds || [];
        await ctx.db.patch(expense.linkedBillId, {
          linkedExpenseIds: linkedIds.filter((expId) => expId !== args.id),
        });
      }
    }

    // If linked to receipts, remove this expense from each receipt's linked expenses
    if (expense?.linkedReceiptIds) {
      for (const receiptId of expense.linkedReceiptIds) {
        const receipt = await ctx.db.get(receiptId);
        if (receipt) {
          const linkedIds = receipt.linkedExpenseIds || [];
          await ctx.db.patch(receiptId, {
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
    linkedBillId: v.optional(v.id("bills")),
    linkedReceiptIds: v.optional(v.array(v.id("receipts"))),
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
      linkedBillId: args.linkedBillId,
      linkedReceiptIds: args.linkedReceiptIds,
    });

    if (args.receiptStorageId) {
      const receiptId = await ctx.db.insert("receipts", {
        storageId: args.receiptStorageId,
        date: args.date,
        linkedExpenseIds: [expenseId],
      });
      await ctx.db.patch(expenseId, {
        linkedReceiptIds: [receiptId],
      });
    }

    // If linked to a bill, add expense to bill's linked expenses array
    if (args.linkedBillId) {
      const bill = await ctx.db.get(args.linkedBillId);
      const currentLinkedIds = bill?.linkedExpenseIds || [];
      await ctx.db.patch(args.linkedBillId, {
        linkedExpenseIds: [...currentLinkedIds, expenseId],
      });
    }

    // If linked to receipts, add expense to each receipt's linked expenses array
    if (args.linkedReceiptIds) {
      for (const receiptId of args.linkedReceiptIds) {
        const receipt = await ctx.db.get(receiptId);
        if (receipt) {
          const currentLinkedIds = receipt.linkedExpenseIds || [];
          if (!currentLinkedIds.includes(expenseId)) {
            await ctx.db.patch(receiptId, {
              linkedExpenseIds: [...currentLinkedIds, expenseId],
            });
          }
        }
      }
    }

    return expenseId;
  },
});

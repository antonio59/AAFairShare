import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthenticatedUser } from "./utils/auth";
import { getUsersMap } from "./utils/batchFetch";

// ============ ADDRESS OPERATIONS ============

export const createAddress = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    return await ctx.db.insert("addresses", {
      name: args.name,
      isArchived: false,
      createdAt: Date.now(),
    });
  },
});

export const updateAddress = mutation({
  args: {
    id: v.id("addresses"),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const archiveAddress = mutation({
  args: {
    id: v.id("addresses"),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    await ctx.db.patch(args.id, {
      isArchived: true,
      archivedAt: Date.now(),
    });
  },
});

export const unarchiveAddress = mutation({
  args: {
    id: v.id("addresses"),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    await ctx.db.patch(args.id, {
      isArchived: false,
      archivedAt: undefined,
    });
  },
});

export const deleteAddress = mutation({
  args: {
    id: v.id("addresses"),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    // Check if address has bills
    const bills = await ctx.db
      .query("bills")
      .withIndex("by_address", (q) => q.eq("addressId", args.id))
      .collect();

    // Delete all bills and their storage
    for (const bill of bills) {
      if (bill.storageId) {
        await ctx.storage.delete(bill.storageId);
      }
      await ctx.db.delete(bill._id);
    }

    await ctx.db.delete(args.id);
  },
});

export const getAllAddresses = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);

    const addresses = await ctx.db.query("addresses").order("desc").collect();

    // Get bill count for each address
    const addressesWithCounts = await Promise.all(
      addresses.map(async (address) => {
        const bills = await ctx.db
          .query("bills")
          .withIndex("by_address", (q) => q.eq("addressId", address._id))
          .collect();

        return {
          ...address,
          billCount: bills.length,
        };
      })
    );

    return addressesWithCounts;
  },
});

export const getActiveAddresses = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);

    const addresses = await ctx.db
      .query("addresses")
      .filter((q) => q.eq(q.field("isArchived"), false) || q.eq(q.field("isArchived"), undefined))
      .order("desc")
      .collect();

    // Get bill count for each address
    const addressesWithCounts = await Promise.all(
      addresses.map(async (address) => {
        const bills = await ctx.db
          .query("bills")
          .withIndex("by_address", (q) => q.eq("addressId", address._id))
          .collect();

        return {
          ...address,
          billCount: bills.length,
        };
      })
    );

    return addressesWithCounts;
  },
});

export const getArchivedAddresses = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);

    const addresses = await ctx.db
      .query("addresses")
      .filter((q) => q.eq(q.field("isArchived"), true))
      .order("desc")
      .collect();

    // Get bill count for each address
    const addressesWithCounts = await Promise.all(
      addresses.map(async (address) => {
        const bills = await ctx.db
          .query("bills")
          .withIndex("by_address", (q) => q.eq("addressId", address._id))
          .collect();

        return {
          ...address,
          billCount: bills.length,
        };
      })
    );

    return addressesWithCounts;
  },
});

// ============ BILL OPERATIONS ============

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const createBill = mutation({
  args: {
    storageId: v.id("_storage"),
    addressId: v.id("addresses"),
    filename: v.string(),
    billType: v.optional(v.string()),
    amount: v.optional(v.number()),
    monthlyAmount: v.optional(v.number()),
    billPeriod: v.optional(v.string()),
    billDate: v.optional(v.string()),
    fileType: v.string(),
    uploadedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    return await ctx.db.insert("bills", {
      storageId: args.storageId,
      addressId: args.addressId,
      filename: args.filename,
      billType: args.billType,
      amount: args.amount,
      monthlyAmount: args.monthlyAmount,
      billPeriod: args.billPeriod,
      billDate: args.billDate,
      uploadDate: new Date().toISOString().split("T")[0],
      uploadedBy: args.uploadedBy,
      fileType: args.fileType,
      isShared: false,
      linkedExpenseIds: [],
    });
  },
});

export const updateBill = mutation({
  args: {
    id: v.id("bills"),
    filename: v.optional(v.string()),
    billType: v.optional(v.string()),
    amount: v.optional(v.number()),
    monthlyAmount: v.optional(v.number()),
    billPeriod: v.optional(v.string()),
    billDate: v.optional(v.string()),
    isShared: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteBill = mutation({
  args: {
    id: v.id("bills"),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const bill = await ctx.db.get(args.id);
    if (bill?.storageId) {
      await ctx.storage.delete(bill.storageId);
    }
    await ctx.db.delete(args.id);
  },
});

export const getBillUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const getBillsByAddress = query({
  args: {
    addressId: v.id("addresses"),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const bills = await ctx.db
      .query("bills")
      .withIndex("by_address", (q) => q.eq("addressId", args.addressId))
      .order("desc")
      .collect();

    const usersMap = await getUsersMap(ctx);

    const billsWithUrls = await Promise.all(
      bills.map(async (bill) => {
        const url = await ctx.storage.getUrl(bill.storageId);
        const uploadedBy = bill.uploadedBy ? usersMap.get(bill.uploadedBy) : null;

        // Get linked expenses
        const linkedExpenses = await Promise.all(
          (bill.linkedExpenseIds || []).map(async (expId) => {
            const exp = await ctx.db.get(expId);
            if (!exp) return null;
            const paidBy = exp.paidById ? usersMap.get(exp.paidById) : null;
            return {
              _id: exp._id,
              amount: exp.amount,
              date: exp.date,
              description: exp.description,
              paidByName: paidBy?.username || paidBy?.name || "Unknown",
            };
          })
        );

        return {
          ...bill,
          url,
          uploadedByName: uploadedBy?.username || uploadedBy?.name || "Unknown",
          uploadedByImage: uploadedBy?.image || "",
          linkedExpenses: linkedExpenses.filter(Boolean),
          linkedExpenseCount: (bill.linkedExpenseIds || []).length,
        };
      })
    );

    return billsWithUrls;
  },
});

export const getAllBills = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);

    const bills = await ctx.db.query("bills").order("desc").collect();
    const usersMap = await getUsersMap(ctx);

    // Get address info for each bill
    const billsWithDetails = await Promise.all(
      bills.map(async (bill) => {
        const address = await ctx.db.get(bill.addressId);
        const url = await ctx.storage.getUrl(bill.storageId);
        const uploadedBy = bill.uploadedBy ? usersMap.get(bill.uploadedBy) : null;

        // Get linked expenses
        const linkedExpenses = await Promise.all(
          (bill.linkedExpenseIds || []).map(async (expId) => {
            const exp = await ctx.db.get(expId);
            if (!exp) return null;
            const paidBy = exp.paidById ? usersMap.get(exp.paidById) : null;
            return {
              _id: exp._id,
              amount: exp.amount,
              date: exp.date,
              description: exp.description,
              paidByName: paidBy?.username || paidBy?.name || "Unknown",
            };
          })
        );

        return {
          ...bill,
          url,
          addressName: address?.name || "Unknown Address",
          addressIsArchived: address?.isArchived || false,
          uploadedByName: uploadedBy?.username || uploadedBy?.name || "Unknown",
          uploadedByImage: uploadedBy?.image || "",
          linkedExpenses: linkedExpenses.filter(Boolean),
          linkedExpenseCount: (bill.linkedExpenseIds || []).length,
        };
      })
    );

    return billsWithDetails;
  },
});

export const getRecentBills = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const limit = args.limit || 10;
    const allBills = await ctx.db.query("bills").order("desc").take(limit);
    const usersMap = await getUsersMap(ctx);

    const billsWithDetails = await Promise.all(
      allBills.map(async (bill) => {
        const address = await ctx.db.get(bill.addressId);
        const url = await ctx.storage.getUrl(bill.storageId);
        const uploadedBy = bill.uploadedBy ? usersMap.get(bill.uploadedBy) : null;

        // Get linked expenses
        const linkedExpenses = await Promise.all(
          (bill.linkedExpenseIds || []).map(async (expId) => {
            const exp = await ctx.db.get(expId);
            if (!exp) return null;
            const paidBy = exp.paidById ? usersMap.get(exp.paidById) : null;
            return {
              _id: exp._id,
              amount: exp.amount,
              date: exp.date,
              description: exp.description,
              paidByName: paidBy?.username || paidBy?.name || "Unknown",
            };
          })
        );

        return {
          ...bill,
          url,
          addressName: address?.name || "Unknown Address",
          addressIsArchived: address?.isArchived || false,
          uploadedByName: uploadedBy?.username || uploadedBy?.name || "Unknown",
          uploadedByImage: uploadedBy?.image || "",
          linkedExpenses: linkedExpenses.filter(Boolean),
          linkedExpenseCount: (bill.linkedExpenseIds || []).length,
        };
      })
    );

    return billsWithDetails;
  },
});

export const moveBillsToAddress = mutation({
  args: {
    billIds: v.array(v.id("bills")),
    newAddressId: v.id("addresses"),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    for (const billId of args.billIds) {
      await ctx.db.patch(billId, {
        addressId: args.newAddressId,
      });
    }

    return { moved: args.billIds.length };
  },
});

// ============ EXPENSE LINKING ============

export const linkBillToExpense = mutation({
  args: {
    billId: v.id("bills"),
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const bill = await ctx.db.get(args.billId);
    const currentLinkedIds = bill?.linkedExpenseIds || [];

    // Add expense to bill's linked expenses (if not already there)
    if (!currentLinkedIds.includes(args.expenseId)) {
      await ctx.db.patch(args.billId, {
        linkedExpenseIds: [...currentLinkedIds, args.expenseId],
      });
    }

    // Link expense to bill
    await ctx.db.patch(args.expenseId, {
      linkedBillId: args.billId,
    });

    return { success: true };
  },
});

export const unlinkBillFromExpense = mutation({
  args: {
    billId: v.id("bills"),
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const bill = await ctx.db.get(args.billId);
    const currentLinkedIds = bill?.linkedExpenseIds || [];

    // Remove expense from bill's linked expenses
    await ctx.db.patch(args.billId, {
      linkedExpenseIds: currentLinkedIds.filter(id => id !== args.expenseId),
    });

    // Unlink expense from bill
    await ctx.db.patch(args.expenseId, {
      linkedBillId: undefined,
    });

    return { success: true };
  },
});

export const getUnlinkedBills = query({
  args: {
    addressId: v.optional(v.id("addresses")),
    billType: v.optional(v.string()), // Optional filter by bill type
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    let bills;
    const addressId = args.addressId;
    if (addressId) {
      bills = await ctx.db
        .query("bills")
        .withIndex("by_address", (q) => q.eq("addressId", addressId))
        .order("desc")
        .collect();
    } else {
      bills = await ctx.db.query("bills").order("desc").collect();
    }

    // Filter to only bills with no linked expenses or empty array
    let unlinkedBills = bills.filter(
      (bill) => !bill.linkedExpenseIds || bill.linkedExpenseIds.length === 0
    );

    // Filter by bill type if specified
    if (args.billType) {
      unlinkedBills = unlinkedBills.filter(
        (bill) => bill.billType === args.billType
      );
    }

    const usersMap = await getUsersMap(ctx);

    const billsWithDetails = await Promise.all(
      unlinkedBills.map(async (bill) => {
        const address = await ctx.db.get(bill.addressId);
        const url = await ctx.storage.getUrl(bill.storageId);
        const uploadedBy = bill.uploadedBy ? usersMap.get(bill.uploadedBy) : null;

        return {
          ...bill,
          url,
          addressName: address?.name || "Unknown Address",
          uploadedByName: uploadedBy?.username || uploadedBy?.name || "Unknown",
          uploadedByImage: uploadedBy?.image || "",
        };
      })
    );

    return billsWithDetails;
  },
});

export const getBillByExpense = query({
  args: {
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const expense = await ctx.db.get(args.expenseId);
    if (!expense?.linkedBillId) {
      return null;
    }

    const bill = await ctx.db.get(expense.linkedBillId);
    if (!bill) {
      return null;
    }

    const address = await ctx.db.get(bill.addressId);
    const url = await ctx.storage.getUrl(bill.storageId);
    const usersMap = await getUsersMap(ctx);
    const uploadedBy = bill.uploadedBy ? usersMap.get(bill.uploadedBy) : null;

    // Get linked expenses details
    const linkedExpenses = await Promise.all(
      (bill.linkedExpenseIds || []).map(async (expId) => {
        const exp = await ctx.db.get(expId);
        if (!exp) return null;
        return {
          _id: exp._id,
          amount: exp.amount,
          date: exp.date,
          description: exp.description,
        };
      })
    );

    return {
      ...bill,
      url,
      addressName: address?.name || "Unknown Address",
      uploadedByName: uploadedBy?.username || uploadedBy?.name || "Unknown",
      uploadedByImage: uploadedBy?.image || "",
      linkedExpenses: linkedExpenses.filter(Boolean),
    };
  },
});

export const getBillWithExpenses = query({
  args: {
    billId: v.id("bills"),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const bill = await ctx.db.get(args.billId);
    if (!bill) {
      return null;
    }

    const address = await ctx.db.get(bill.addressId);
    const url = await ctx.storage.getUrl(bill.storageId);
    const usersMap = await getUsersMap(ctx);
    const uploadedBy = bill.uploadedBy ? usersMap.get(bill.uploadedBy) : null;

    // Get linked expenses details
    const linkedExpenses = await Promise.all(
      (bill.linkedExpenseIds || []).map(async (expId) => {
        const exp = await ctx.db.get(expId);
        if (!exp) return null;
        const paidBy = exp.paidById ? usersMap.get(exp.paidById) : null;
        return {
          _id: exp._id,
          amount: exp.amount,
          date: exp.date,
          description: exp.description,
          paidByName: paidBy?.username || paidBy?.name || "Unknown",
        };
      })
    );

    return {
      ...bill,
      url,
      addressName: address?.name || "Unknown Address",
      uploadedByName: uploadedBy?.username || uploadedBy?.name || "Unknown",
      uploadedByImage: uploadedBy?.image || "",
      linkedExpenses: linkedExpenses.filter(Boolean),
    };
  },
});

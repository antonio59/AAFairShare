import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthenticatedUser } from "./utils/auth";
import { assertValidDate } from "./utils/validation";
import { getUsersMap } from "./utils/batchFetch";

// ============ UPLOAD ============

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// ============ CRUD ============

export const create = mutation({
  args: {
    storageId: v.id("_storage"),
    type: v.string(),
    title: v.optional(v.string()),
    amount: v.optional(v.number()),
    date: v.string(),
    notes: v.optional(v.string()),
    fileType: v.string(),
    uploadedBy: v.optional(v.id("users")),
    // Bill-specific
    addressId: v.optional(v.id("addresses")),
    billType: v.optional(v.string()),
    monthlyAmount: v.optional(v.number()),
    billPeriod: v.optional(v.string()),
    // Expiry-related
    expiryDate: v.optional(v.string()),
    // Metadata & tags
    metadata: v.optional(v.record(v.string(), v.string())),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    assertValidDate(args.date, "date");

    return await ctx.db.insert("documents", {
      storageId: args.storageId,
      type: args.type,
      title: args.title,
      amount: args.amount,
      date: args.date,
      notes: args.notes,
      fileType: args.fileType,
      uploadedBy: args.uploadedBy,
      uploadDate: new Date().toISOString().split("T")[0],
      addressId: args.addressId,
      billType: args.billType,
      monthlyAmount: args.monthlyAmount,
      billPeriod: args.billPeriod,
      expiryDate: args.expiryDate,
      metadata: args.metadata,
      tags: args.tags || [],
      linkedExpenseIds: [],
      versionHistory: [],
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("documents"),
    type: v.optional(v.string()),
    title: v.optional(v.string()),
    amount: v.optional(v.number()),
    date: v.optional(v.string()),
    notes: v.optional(v.string()),
    addressId: v.optional(v.id("addresses")),
    billType: v.optional(v.string()),
    monthlyAmount: v.optional(v.number()),
    billPeriod: v.optional(v.string()),
    expiryDate: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.string())),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined),
    );
    await ctx.db.patch(id, filteredUpdates);
  },
});

export const replaceFile = mutation({
  args: {
    id: v.id("documents"),
    newStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Document not found");

    // Archive old version
    const versionEntry = {
      storageId: doc.storageId,
      replacedAt: new Date().toISOString(),
    };
    const history = doc.versionHistory || [];
    history.push(versionEntry);

    const oldStorageId = doc.storageId;

    // Update DB first, then delete old storage
    await ctx.db.patch(args.id, {
      storageId: args.newStorageId,
      versionHistory: history,
    });

    if (oldStorageId) {
      await ctx.storage.delete(oldStorageId);
    }
  },
});

export const bulkDelete = mutation({
  args: {
    ids: v.array(v.id("documents")),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    for (const id of args.ids) {
      const doc = await ctx.db.get(id);
      if (doc?.storageId) {
        await ctx.storage.delete(doc.storageId);
      }
      if (doc?.linkedExpenseIds) {
        for (const expenseId of doc.linkedExpenseIds) {
          const expense = await ctx.db.get(expenseId);
          if (expense?.linkedDocumentIds) {
            await ctx.db.patch(expenseId, {
              linkedDocumentIds: expense.linkedDocumentIds.filter((did) => did !== id),
            });
          }
        }
      }
      await ctx.db.delete(id);
    }

    return { deleted: args.ids.length };
  },
});

export const getStats = query({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_month", (q) => q.eq("month", args.month))
      .collect();

    const withDocs = expenses.filter(
      (e) => e.linkedDocumentIds && e.linkedDocumentIds.length > 0,
    ).length;

    return {
      withDocuments: withDocs,
      total: expenses.length,
      coverage: expenses.length > 0 ? Math.round((withDocs / expenses.length) * 100) : 0,
    };
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const q = args.query.toLowerCase().trim();
    if (!q) return [];

    const documents = await ctx.db.query("documents").order("desc").collect();
    const usersMap = await getUsersMap(ctx);

    const filtered = documents.filter((doc) =>
      doc.title?.toLowerCase().includes(q) ||
      doc.notes?.toLowerCase().includes(q) ||
      doc.type.toLowerCase().includes(q) ||
      doc.billType?.toLowerCase().includes(q) ||
      doc.tags?.some((tag) => tag.toLowerCase().includes(q)),
    );

    return await Promise.all(
      filtered.map(async (doc) => {
        const url = await ctx.storage.getUrl(doc.storageId);
        const uploadedBy = doc.uploadedBy ? usersMap.get(doc.uploadedBy) : null;
        return {
          ...doc,
          url,
          uploadedByName: uploadedBy?.username || uploadedBy?.name || "Unknown",
          uploadedByImage: uploadedBy?.image || "",
          linkedExpenseCount: (doc.linkedExpenseIds || []).length,
        };
      }),
    );
  },
});

export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const doc = await ctx.db.get(args.id);
    if (doc?.storageId) {
      await ctx.storage.delete(doc.storageId);
    }

    // Unlink from all linked expenses
    if (doc?.linkedExpenseIds) {
      for (const expenseId of doc.linkedExpenseIds) {
        const expense = await ctx.db.get(expenseId);
        if (expense?.linkedDocumentIds) {
          await ctx.db.patch(expenseId, {
            linkedDocumentIds: expense.linkedDocumentIds.filter(
              (did) => did !== args.id,
            ),
          });
        }
      }
    }

    await ctx.db.delete(args.id);
  },
});

// ============ QUERIES ============

export const getDocumentUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);

    const documents = await ctx.db.query("documents").order("desc").collect();
    const usersMap = await getUsersMap(ctx);

    const docsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        const url = await ctx.storage.getUrl(doc.storageId);
        const uploadedBy = doc.uploadedBy ? usersMap.get(doc.uploadedBy) : null;
        return {
          ...doc,
          url,
          uploadedByName: uploadedBy?.username || uploadedBy?.name || "Unknown",
          uploadedByImage: uploadedBy?.image || "",
          linkedExpenseCount: (doc.linkedExpenseIds || []).length,
        };
      }),
    );

    return docsWithUrls;
  },
});

export const getByType = query({
  args: { type: v.string() },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .order("desc")
      .collect();

    const usersMap = await getUsersMap(ctx);

    const docsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        const url = await ctx.storage.getUrl(doc.storageId);
        const uploadedBy = doc.uploadedBy ? usersMap.get(doc.uploadedBy) : null;
        return {
          ...doc,
          url,
          uploadedByName: uploadedBy?.username || uploadedBy?.name || "Unknown",
          uploadedByImage: uploadedBy?.image || "",
          linkedExpenseCount: (doc.linkedExpenseIds || []).length,
        };
      }),
    );

    return docsWithUrls;
  },
});

export const getByAddress = query({
  args: { addressId: v.id("addresses") },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_address", (q) => q.eq("addressId", args.addressId))
      .order("desc")
      .collect();

    const usersMap = await getUsersMap(ctx);

    const docsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        const url = await ctx.storage.getUrl(doc.storageId);
        const uploadedBy = doc.uploadedBy ? usersMap.get(doc.uploadedBy) : null;
        return {
          ...doc,
          url,
          uploadedByName: uploadedBy?.username || uploadedBy?.name || "Unknown",
          uploadedByImage: uploadedBy?.image || "",
          linkedExpenseCount: (doc.linkedExpenseIds || []).length,
        };
      }),
    );

    return docsWithUrls;
  },
});

export const getExpiringSoon = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const days = args.days || 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    const cutoffStr = cutoff.toISOString().split("T")[0];

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_expiry", (q) =>
        q.lte("expiryDate", cutoffStr),
      )
      .collect();

    // Filter out expired ones that are too old (optional — show expiring within window)
    const today = new Date().toISOString().split("T")[0];

    const usersMap = await getUsersMap(ctx);

    const docsWithUrls = await Promise.all(
      documents
        .filter((doc) => doc.expiryDate && doc.expiryDate >= today)
        .map(async (doc) => {
          const url = await ctx.storage.getUrl(doc.storageId);
          const uploadedBy = doc.uploadedBy
            ? usersMap.get(doc.uploadedBy)
            : null;
          return {
            ...doc,
            url,
            uploadedByName:
              uploadedBy?.username || uploadedBy?.name || "Unknown",
            uploadedByImage: uploadedBy?.image || "",
          };
        }),
    );

    return docsWithUrls;
  },
});

export const getById = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const doc = await ctx.db.get(args.id);
    if (!doc) return null;

    const url = await ctx.storage.getUrl(doc.storageId);
    const usersMap = await getUsersMap(ctx);
    const uploadedBy = doc.uploadedBy ? usersMap.get(doc.uploadedBy) : null;

    // Get linked expenses details
    const linkedExpenses = await Promise.all(
      (doc.linkedExpenseIds || []).map(async (expId) => {
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
      }),
    );

    return {
      ...doc,
      url,
      uploadedByName: uploadedBy?.username || uploadedBy?.name || "Unknown",
      uploadedByImage: uploadedBy?.image || "",
      linkedExpenses: linkedExpenses.filter(Boolean),
    };
  },
});

export const getDocumentsByExpense = query({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const expense = await ctx.db.get(args.expenseId);
    if (!expense?.linkedDocumentIds?.length) return [];

    const docs = await Promise.all(
      expense.linkedDocumentIds.map(async (id) => {
        const doc = await ctx.db.get(id);
        if (!doc) return null;
        const url = await ctx.storage.getUrl(doc.storageId);
        return { ...doc, url };
      }),
    );

    return docs.filter(Boolean);
  },
});

// ============ EXPENSE LINKING ============

export const linkToExpense = mutation({
  args: {
    documentId: v.id("documents"),
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const doc = await ctx.db.get(args.documentId);
    const currentLinkedIds = doc?.linkedExpenseIds || [];

    if (!currentLinkedIds.includes(args.expenseId)) {
      await ctx.db.patch(args.documentId, {
        linkedExpenseIds: [...currentLinkedIds, args.expenseId],
      });
    }

    const expense = await ctx.db.get(args.expenseId);
    const expenseLinkedIds = expense?.linkedDocumentIds || [];
    if (!expenseLinkedIds.includes(args.documentId)) {
      await ctx.db.patch(args.expenseId, {
        linkedDocumentIds: [...expenseLinkedIds, args.documentId],
      });
    }

    return { success: true };
  },
});

export const unlinkFromExpense = mutation({
  args: {
    documentId: v.id("documents"),
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const doc = await ctx.db.get(args.documentId);
    const currentLinkedIds = doc?.linkedExpenseIds || [];
    await ctx.db.patch(args.documentId, {
      linkedExpenseIds: currentLinkedIds.filter((id) => id !== args.expenseId),
    });

    const expense = await ctx.db.get(args.expenseId);
    const expenseLinkedIds = expense?.linkedDocumentIds || [];
    await ctx.db.patch(args.expenseId, {
      linkedDocumentIds: expenseLinkedIds.filter(
        (id) => id !== args.documentId,
      ),
    });

    return { success: true };
  },
});

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { requireAuthenticatedUser } from "./utils/auth";
import { recordActivity } from "./utils/activityLog";
import { documentLinkNote } from "./utils/activityFeed";
import {
  assertPositiveAmount,
  assertValidDate,
  assertValidMonth,
  assertValidFrequency,
  assertValidSplitType,
} from "./utils/validation";
import {
  getCategoriesMap,
  getLocationsMap,
  getUsersMap,
} from "./utils/batchFetch";
import {
  addMonthsKeepingAnchor,
  dayOf,
  formatLondonDate,
  inferAnchor,
  planOccurrences,
} from "./utils/calendar";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);

    const recurring = await ctx.db
      .query("recurring")
      .withIndex("by_next_due_date")
      .collect();

    // Batch fetch all related data
    const [categoriesMap, locationsMap, usersMap] = await Promise.all([
      getCategoriesMap(ctx),
      getLocationsMap(ctx),
      getUsersMap(ctx),
    ]);

    const today = formatLondonDate();

    const recurringWithDetails = recurring.map((item) => {
      const category = categoriesMap.get(item.categoryId);
      const location = locationsMap.get(item.locationId);
      const user = usersMap.get(item.userId);
      const status = item.endDate && item.endDate < today ? "ended" : "active";

      return {
        ...item,
        category: category?.name ?? "",
        location: location?.name ?? "",
        user: user,
        status,
      };
    });

    return recurringWithDetails;
  },
});

export const getById = query({
  args: { id: v.id("recurring") },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    amount: v.number(),
    nextDueDate: v.string(),
    endDate: v.optional(v.string()),
    frequency: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
    categoryName: v.string(),
    locationName: v.string(),
    splitType: v.string(),
    linkedDocumentIds: v.optional(v.array(v.id("documents"))),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    assertPositiveAmount(args.amount, "amount");
    assertValidDate(args.nextDueDate, "nextDueDate");
    assertValidFrequency(args.frequency, "frequency");
    assertValidSplitType(args.splitType, "splitType");
    if (args.endDate) {
      assertValidDate(args.endDate, "endDate");
    }

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

    return await ctx.db.insert("recurring", {
      amount: args.amount,
      nextDueDate: args.nextDueDate,
      anchorDay: dayOf(args.nextDueDate),
      endDate: args.endDate,
      frequency: args.frequency,
      description: args.description,
      userId: args.userId,
      categoryId: category!._id,
      locationId: location!._id,
      splitType: args.splitType || "50/50",
      linkedDocumentIds: args.linkedDocumentIds || [],
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("recurring"),
    amount: v.optional(v.number()),
    nextDueDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    frequency: v.optional(v.string()),
    description: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    categoryName: v.optional(v.string()),
    locationName: v.optional(v.string()),
    splitType: v.optional(v.string()),
    linkedDocumentIds: v.optional(v.array(v.id("documents"))),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const { id, categoryName, locationName, ...updates } = args;

    const updateData: Record<string, unknown> = {};

    if (updates.amount !== undefined) {
      assertPositiveAmount(updates.amount, "amount");
      updateData.amount = updates.amount;
    }
    if (updates.nextDueDate !== undefined) {
      assertValidDate(updates.nextDueDate, "nextDueDate");
      updateData.nextDueDate = updates.nextDueDate;
      updateData.anchorDay = dayOf(updates.nextDueDate);
    }
    if (updates.endDate !== undefined) {
      assertValidDate(updates.endDate, "endDate");
      updateData.endDate = updates.endDate;
    }
    if (updates.frequency !== undefined) {
      assertValidFrequency(updates.frequency, "frequency");
      updateData.frequency = updates.frequency;
    }
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.userId !== undefined) updateData.userId = updates.userId;
    if (updates.splitType !== undefined) {
      assertValidSplitType(updates.splitType, "splitType");
      updateData.splitType = updates.splitType;
    }
    if (updates.linkedDocumentIds !== undefined) {
      updateData.linkedDocumentIds = updates.linkedDocumentIds;
    }

    if (categoryName) {
      let category = await ctx.db
        .query("categories")
        .withIndex("by_name", (q) => q.eq("name", categoryName))
        .first();

      if (!category) {
        const categoryId = await ctx.db.insert("categories", {
          name: categoryName,
        });
        category = await ctx.db.get(categoryId);
      }
      updateData.categoryId = category!._id;
    }

    if (locationName) {
      let location = await ctx.db
        .query("locations")
        .withIndex("by_name", (q) => q.eq("name", locationName))
        .first();

      if (!location) {
        const locationId = await ctx.db.insert("locations", {
          name: locationName,
        });
        location = await ctx.db.get(locationId);
      }
      updateData.locationId = location!._id;
    }

    await ctx.db.patch(id, updateData);
  },
});

export const remove = mutation({
  args: { id: v.id("recurring") },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    await ctx.db.delete(args.id);
  },
});

export const linkDocument = mutation({
  args: {
    recurringId: v.id("recurring"),
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);

    const recurring = await ctx.db.get(args.recurringId);
    const current = recurring?.linkedDocumentIds || [];
    if (!current.includes(args.documentId)) {
      await ctx.db.patch(args.recurringId, {
        linkedDocumentIds: [...current, args.documentId],
      });
      const doc = await ctx.db.get(args.documentId);
      await recordActivity(ctx, {
        action: "document.linked",
        actorId: userId,
        description: documentLinkNote(doc, recurring?.description),
        documentId: args.documentId,
        category: doc?.category,
        location: doc?.location,
      });
    }

    // Note: we don't link back on document.linkedExpenseIds since recurring
    // is a separate table. Future enhancement could track recurring links in metadata.
  },
});

export const unlinkDocument = mutation({
  args: {
    recurringId: v.id("recurring"),
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);

    const recurring = await ctx.db.get(args.recurringId);
    const current = recurring?.linkedDocumentIds || [];
    if (current.includes(args.documentId)) {
      const doc = await ctx.db.get(args.documentId);
      await recordActivity(ctx, {
        action: "document.unlinked",
        actorId: userId,
        description: documentLinkNote(doc, recurring?.description),
        documentId: args.documentId,
        category: doc?.category,
        location: doc?.location,
      });
    }
    await ctx.db.patch(args.recurringId, {
      linkedDocumentIds: current.filter((id) => id !== args.documentId),
    });
  },
});

function anchorFor(item: {
  anchorDay?: number;
  lastGeneratedDate?: string;
  nextDueDate: string;
}): number {
  return item.anchorDay ?? inferAnchor(item.lastGeneratedDate, item.nextDueDate);
}

export const generateExpense = mutation({
  args: { id: v.id("recurring") },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);

    const recurring = await ctx.db.get(args.id);
    if (!recurring) {
      throw new Error("Recurring expense not found");
    }

    assertValidDate(recurring.nextDueDate, "nextDueDate");
    if (recurring.endDate && recurring.nextDueDate > recurring.endDate) {
      throw new Error("Recurring expense has ended");
    }

    const anchor = anchorFor(recurring);
    const [year, monthNum] = recurring.nextDueDate.split("-");
    const month = `${year}-${monthNum}`;
    assertValidMonth(month, "month");

    const expenseId = await ctx.db.insert("expenses", {
      amount: recurring.amount,
      date: recurring.nextDueDate,
      month: month,
      description: recurring.description,
      paidById: recurring.userId,
      categoryId: recurring.categoryId,
      locationId: recurring.locationId,
      splitType: recurring.splitType,
      linkedDocumentIds: recurring.linkedDocumentIds,
    });

    await recordActivity(ctx, {
      action: "expense.added",
      actorId: userId,
      amount: recurring.amount,
      description: recurring.description,
      expenseId,
      categoryId: recurring.categoryId,
      locationId: recurring.locationId,
    });

    const nextDueDate = addMonthsKeepingAnchor(recurring.nextDueDate, anchor, 1);

    await ctx.db.patch(args.id, {
      nextDueDate,
      lastGeneratedDate: recurring.nextDueDate,
      anchorDay: anchor,
    });
  },
});

// Internal: auto-generate all due recurring expenses (called by cron)
export const autoGenerateExpenses = internalMutation({
  args: {},
  handler: async (ctx) => {
    const today = formatLondonDate();

    const recurring = await ctx.db
      .query("recurring")
      .withIndex("by_next_due_date", (q) => q.lte("nextDueDate", today))
      .collect();

    let generated = 0;

    for (const item of recurring) {
      const anchor = anchorFor(item);
      const dates = planOccurrences(item.nextDueDate, anchor, today, item.endDate);
      for (const date of dates) {
        const month = date.slice(0, 7);
        const expenseId = await ctx.db.insert("expenses", {
          amount: item.amount,
          date,
          month,
          description: item.description,
          paidById: item.userId,
          categoryId: item.categoryId,
          locationId: item.locationId,
          splitType: item.splitType,
          linkedDocumentIds: item.linkedDocumentIds,
        });

        await recordActivity(ctx, {
          action: "expense.added",
          amount: item.amount,
          description: item.description,
          expenseId,
          categoryId: item.categoryId,
          locationId: item.locationId,
          automatic: true,
        });
        generated++;
      }

      if (dates.length === 0) continue;
      const last = dates[dates.length - 1];
      await ctx.db.patch(item._id, {
        nextDueDate: addMonthsKeepingAnchor(last, anchor, 1),
        lastGeneratedDate: last,
        anchorDay: anchor,
        isAutoGenerated: true,
      });
    }

    return { generated };
  },
});

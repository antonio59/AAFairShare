import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { requireAuthenticatedUser } from "./utils/auth";
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const recurringWithDetails = recurring.map((item) => {
      const category = categoriesMap.get(item.categoryId);
      const location = locationsMap.get(item.locationId);
      const user = usersMap.get(item.userId);
      const endDate = item.endDate ? new Date(item.endDate) : null;
      const status = endDate && endDate < today ? "ended" : "active";

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
    await requireAuthenticatedUser(ctx);

    const recurring = await ctx.db.get(args.recurringId);
    const current = recurring?.linkedDocumentIds || [];
    if (!current.includes(args.documentId)) {
      await ctx.db.patch(args.recurringId, {
        linkedDocumentIds: [...current, args.documentId],
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
    await requireAuthenticatedUser(ctx);

    const recurring = await ctx.db.get(args.recurringId);
    const current = recurring?.linkedDocumentIds || [];
    await ctx.db.patch(args.recurringId, {
      linkedDocumentIds: current.filter((id) => id !== args.documentId),
    });
  },
});

function addOneMonth(dateStr: string): string {
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  month += 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }

  // Handle month-end dates (e.g., Jan 31 -> Feb 28/29)
  const maxDay = new Date(year, month, 0).getDate();
  const newDay = Math.min(day, maxDay);

  return `${year}-${String(month).padStart(2, "0")}-${String(newDay).padStart(2, "0")}`;
}

export const generateExpense = mutation({
  args: { id: v.id("recurring") },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const recurring = await ctx.db.get(args.id);
    if (!recurring) {
      throw new Error("Recurring expense not found");
    }

    assertValidDate(recurring.nextDueDate, "nextDueDate");

    const [year, monthNum] = recurring.nextDueDate.split("-");
    const month = `${year}-${monthNum}`;
    assertValidMonth(month, "month");

    await ctx.db.insert("expenses", {
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

    const nextDueDate = addOneMonth(recurring.nextDueDate);

    await ctx.db.patch(args.id, {
      nextDueDate,
      lastGeneratedDate: recurring.nextDueDate,
    });
  },
});

// Internal: auto-generate all due recurring expenses (called by cron)
export const autoGenerateExpenses = internalMutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];

    const recurring = await ctx.db
      .query("recurring")
      .withIndex("by_next_due_date", (q) => q.lte("nextDueDate", today))
      .collect();

    let generated = 0;

    for (const item of recurring) {
      // Skip if ended
      if (item.endDate && item.endDate < today) continue;

      // Generate expense
      const [year, monthNum] = item.nextDueDate.split("-");
      const month = `${year}-${monthNum}`;

      await ctx.db.insert("expenses", {
        amount: item.amount,
        date: item.nextDueDate,
        month: month,
        description: item.description,
        paidById: item.userId,
        categoryId: item.categoryId,
        locationId: item.locationId,
        splitType: item.splitType,
        linkedDocumentIds: item.linkedDocumentIds,
      });

      const nextDueDate = addOneMonth(item.nextDueDate);

      await ctx.db.patch(item._id, {
        nextDueDate,
        lastGeneratedDate: item.nextDueDate,
        isAutoGenerated: true,
      });

      generated++;
    }

    return { generated };
  },
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const recurring = await ctx.db
      .query("recurring")
      .withIndex("by_next_due_date")
      .collect();

    const recurringWithDetails = await Promise.all(
      recurring.map(async (item) => {
        const category = await ctx.db.get(item.categoryId);
        const location = await ctx.db.get(item.locationId);
        const user = await ctx.db.get(item.userId);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = item.endDate ? new Date(item.endDate) : null;
        const status = endDate && endDate < today ? "ended" : "active";

        return {
          ...item,
          category: category?.name ?? "",
          location: location?.name ?? "",
          user: user,
          status,
        };
      })
    );

    return recurringWithDetails;
  },
});

export const getById = query({
  args: { id: v.id("recurring") },
  handler: async (ctx, args) => {
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
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");
    
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
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");
    
    const { id, categoryName, locationName, ...updates } = args;

    const updateData: Record<string, unknown> = {};

    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.nextDueDate !== undefined) updateData.nextDueDate = updates.nextDueDate;
    if (updates.endDate !== undefined) updateData.endDate = updates.endDate;
    if (updates.frequency !== undefined) updateData.frequency = updates.frequency;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.userId !== undefined) updateData.userId = updates.userId;
    if (updates.splitType !== undefined) updateData.splitType = updates.splitType;

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
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");
    
    await ctx.db.delete(args.id);
  },
});

export const generateExpense = mutation({
  args: { id: v.id("recurring") },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");
    
    const recurring = await ctx.db.get(args.id);
    if (!recurring) {
      throw new Error("Recurring expense not found");
    }

    const [year, monthNum] = recurring.nextDueDate.split("-");
    const month = `${year}-${monthNum}`;

    await ctx.db.insert("expenses", {
      amount: recurring.amount,
      date: recurring.nextDueDate,
      month: month,
      description: recurring.description,
      paidById: recurring.userId,
      categoryId: recurring.categoryId,
      locationId: recurring.locationId,
      splitType: recurring.splitType,
    });

    const currentDate = new Date(recurring.nextDueDate);
    let nextDueDate: Date;

    switch (recurring.frequency) {
      case "weekly":
        nextDueDate = new Date(currentDate.setDate(currentDate.getDate() + 7));
        break;
      case "yearly":
        nextDueDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + 1));
        break;
      case "monthly":
      default:
        nextDueDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
        break;
    }

    await ctx.db.patch(args.id, {
      nextDueDate: nextDueDate.toISOString().split("T")[0],
    });
  },
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("locations").collect();
  },
});

export const getById = query({
  args: { id: v.id("locations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("locations")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("locations")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("locations", {
      name: args.name,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("locations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getOrCreate = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("locations")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("locations", {
      name: args.name,
    });
  },
});

export const checkUsage = query({
  args: { id: v.id("locations") },
  handler: async (ctx, args) => {
    const expenseUsage = await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("locationId"), args.id))
      .first();

    if (expenseUsage) return true;

    const recurringUsage = await ctx.db
      .query("recurring")
      .filter((q) => q.eq(q.field("locationId"), args.id))
      .first();

    return recurringUsage !== null;
  },
});

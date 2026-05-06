import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthenticatedUser } from "./utils/auth";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);
    return await ctx.db.query("addresses").order("desc").collect();
  },
});

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);
    const all = await ctx.db.query("addresses").order("desc").collect();
    return all.filter((a) => !a.isArchived);
  },
});

export const getArchived = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);
    return await ctx.db
      .query("addresses")
      .withIndex("by_archived", (q) => q.eq("isArchived", true))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    return await ctx.db.insert("addresses", {
      name: args.name,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: { id: v.id("addresses"), name: v.string() },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    await ctx.db.patch(args.id, { name: args.name });
  },
});

export const archive = mutation({
  args: { id: v.id("addresses") },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    await ctx.db.patch(args.id, { isArchived: true, archivedAt: Date.now() });
  },
});

export const unarchive = mutation({
  args: { id: v.id("addresses") },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    await ctx.db.patch(args.id, { isArchived: undefined, archivedAt: undefined });
  },
});

export const remove = mutation({
  args: { id: v.id("addresses") },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    await ctx.db.delete(args.id);
  },
});

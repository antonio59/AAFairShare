import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAuthenticatedUser } from "./utils/auth";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);
    // Sort by _creationTime to ensure consistent ordering across all clients
    return await ctx.db.query("users").order("asc").collect();
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    return await ctx.db.get(args.id);
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return {
      _id: user._id,
      email: user.email,
      username: user.name || user.username || user.email?.split("@")[0] || "User",
      avatar: user.image || user.photoUrl,
    };
  },
});

// For migration - creates user directly
export const store = mutation({
  args: {},
  handler: async (ctx) => {
    return await requireAuthenticatedUser(ctx);
  },
});

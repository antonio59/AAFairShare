import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAuthenticatedUser } from "./utils/auth";
import { hashPassword } from "./utils/password";

export const getUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .unique();
  },
});

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

// Admin function to set/reset password
export const setPassword = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Note: In production, this should require admin authentication
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const passwordHash = hashPassword(args.password);
    
    await ctx.db.patch(user._id, {
      passwordHash,
      passwordUpdatedAt: Date.now(),
    });

    return { success: true };
  },
});

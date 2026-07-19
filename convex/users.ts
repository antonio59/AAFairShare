import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAuthenticatedUser } from "./utils/auth";

export const getUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .unique();
  },
});

export const getCurrentUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    // Never expose credentials to the client
    const { passwordHash: _ph, tokenIdentifier: _ti, ...safeUser } = user;
    return safeUser;
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
      username:
        user.name || user.username || user.email?.split("@")[0] || "User",
      avatar: user.image || user.photoUrl,
    };
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);
    const users = await ctx.db.query("users").collect();
    // Strip sensitive fields
    return users.map((user) => ({
      _id: user._id,
      email: user.email,
      name: user.name,
      username: user.username,
      image: user.image,
      photoUrl: user.photoUrl,
    }));
  },
});

export const getUserById = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const updateUser = mutation({
  args: {
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const updateData: { name?: string } = {};
    if (args.name !== undefined) updateData.name = args.name;

    await ctx.db.patch(user._id, updateData);

    const updated = await ctx.db.get(user._id);
    if (!updated) return null;
    const { passwordHash: _ph, tokenIdentifier: _ti, ...safeUser } = updated;
    return safeUser;
  },
});


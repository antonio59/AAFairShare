import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAuthenticatedUser } from "./utils/auth";
import { hashPassword, verifyPassword } from "./utils/password";

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

    return await ctx.db.get(userId);
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

    return await ctx.db.get(user._id);
  },
});

export const updatePassword = mutation({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    if (!user.passwordHash) {
      throw new Error("No password set for this user");
    }

    const isCurrentValid = verifyPassword(args.currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password and update
    const newPasswordHash = hashPassword(args.newPassword);

    await ctx.db.patch(user._id, {
      passwordHash: newPasswordHash,
      passwordUpdatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const resetPassword = mutation({
  args: {
    email: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email.toLowerCase()))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const newPasswordHash = hashPassword(args.newPassword);

    await ctx.db.patch(user._id, {
      passwordHash: newPasswordHash,
      passwordUpdatedAt: Date.now(),
    });

    return { success: true };
  },
});

import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { hashPassword, verifyPassword } from "./utils/password";
import { requireAuthenticatedUser } from "./utils/auth";

/**
 * Internal mutation to set a user's password directly.
 * Used for seeding/admin purposes.
 */
export const setPassword = internalMutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const passwordHash = await hashPassword(args.password);

    await ctx.db.patch(user._id, {
      passwordHash,
      passwordUpdatedAt: Date.now(),
    });
  },
});

/**
 * Mutation for a user to change their own password.
 * Requires the current password for verification.
 */
export const changePassword = mutation({
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

    if (!user.passwordHash) {
      // If user has no password (e.g. only OAuth before), maybe allow setting it if they are authenticated?
      // But typically we want them to verify credentials. 
      // Since we replaced OAuth, they MUST have a password to be logged in via Credentials.
      // But they might be logged in via old session?
      // Ticket assumes we switch to Credentials.
      throw new Error("User has no password set");
    }

    const isValid = await verifyPassword(args.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new Error("Incorrect current password");
    }

    const passwordHash = await hashPassword(args.newPassword);

    await ctx.db.patch(userId, {
      passwordHash,
      passwordUpdatedAt: Date.now(),
    });
  },
});

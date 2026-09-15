import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { getAuthSessionId } from "@convex-dev/auth/server";
import { hashPassword, verifyPassword } from "./utils/password";
import { assertStrongPassword } from "./utils/validation";
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

    assertStrongPassword(args.password);

    const passwordHash = hashPassword(args.password);

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

    const isValid = verifyPassword(args.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new Error("Incorrect current password");
    }

    assertStrongPassword(args.newPassword, "newPassword");

    const passwordHash = hashPassword(args.newPassword);

    await ctx.db.patch(userId, {
      passwordHash,
      passwordUpdatedAt: Date.now(),
    });

    // Revoke every other session so a stolen token can't survive rotation.
    const currentSessionId = await getAuthSessionId(ctx);
    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
    for (const session of sessions) {
      if (session._id !== currentSessionId) {
        await ctx.db.delete(session._id);
      }
    }
  },
});

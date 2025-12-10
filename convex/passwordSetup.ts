import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { hashPassword } from "./utils/password";

/**
 * TEMPORARY PUBLIC MUTATION - DELETE AFTER SETTING PASSWORDS
 * 
 * This is a temporary public mutation to allow setting passwords
 * without needing convex dev to run with typecheck.
 * 
 * DELETE THIS FILE after you've set passwords for both users.
 */
export const setPasswordPublic = mutation({
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

    return { success: true, email: args.email };
  },
});

import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { hashPassword } from "./utils/password";

/**
 * TEMPORARY PUBLIC MUTATION - DELETE AFTER PASSWORDS ARE SET
 * 
 * This is a workaround to set passwords before the internal mutation is deployed.
 * DELETE THIS FILE after both users have passwords.
 */
export const setUserPassword = mutation({
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
      throw new Error(`User not found: ${args.email}`);
    }

    const passwordHash = await hashPassword(args.password);

    await ctx.db.patch(user._id, {
      passwordHash,
      passwordUpdatedAt: Date.now(),
    });

    return { 
      success: true, 
      email: args.email,
      message: "Password set successfully" 
    };
  },
});

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const deleteDuplicateUser = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Delete auth accounts for this user
    const authAccounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const account of authAccounts) {
      await ctx.db.delete(account._id);
    }

    // Delete auth sessions for this user
    const authSessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const session of authSessions) {
      await ctx.db.delete(session._id);
    }

    // Delete the user
    await ctx.db.delete(args.userId);
    
    return { success: true };
  },
});

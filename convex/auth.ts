import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      // If user already linked, return existing
      if (args.existingUserId) {
        return args.existingUserId;
      }

      // Get email from profile
      const email = args.profile?.email as string | undefined;
      
      if (email) {
        const existingUser = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", email))
          .first();

        if (existingUser) {
          await ctx.db.patch(existingUser._id, {
            image: args.profile?.image as string | undefined,
            name: args.profile?.name as string | undefined,
            emailVerificationTime: Date.now(),
          });
          return existingUser._id;
        }
      }

      // No existing user found - reject for closed app
      throw new Error("This is a closed app. Only existing users can sign in.");
    },
  },
});

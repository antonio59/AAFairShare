import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { convexAuth } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { verifyPassword } from "./utils/password";
import type { DataModel } from "./_generated/dataModel";
import { checkLoginRateLimit, recordLoginAttempt } from "./utils/rateLimit";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    ConvexCredentials<DataModel>({
      id: "password",
      authorize: async (credentials, ctx) => {
        const email = (credentials.email as string | undefined)
          ?.trim()
          .toLowerCase();
        const password = credentials.password as string | undefined;

        if (!email || !password) {
          throw new Error("Email and password are required");
        }

        // Check rate limiting
        const rateLimit = await checkLoginRateLimit(ctx, email);
        if (!rateLimit.allowed) {
          const minutesLeft = rateLimit.lockedUntil
            ? Math.ceil((rateLimit.lockedUntil - Date.now()) / 60000)
            : 15;
          throw new Error(
            `Too many login attempts. Please try again in ${minutesLeft} minutes.`,
          );
        }

        const user = await ctx.runQuery(internal.users.getUserByEmail, {
          email,
        });

        if (!user) {
          await recordLoginAttempt(ctx, email, false);
          throw new Error("Invalid email or password");
        }

        if (!user.passwordHash) {
          throw new Error(
            "Password not set. Contact admin to set up your password.",
          );
        }

        const isValid = verifyPassword(password, user.passwordHash);

        if (!isValid) {
          await recordLoginAttempt(ctx, email, false);
          throw new Error("Invalid email or password");
        }

        // Clear rate limit on successful login
        await recordLoginAttempt(ctx, email, true);

        return { userId: user._id };
      },
    }),
  ],
});

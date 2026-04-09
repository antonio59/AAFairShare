import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { convexAuth } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { verifyPassword } from "./utils/password";
import type { DataModel } from "./_generated/dataModel";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    ConvexCredentials<DataModel>({
      id: "password",
      authorize: async (credentials, ctx) => {
        const email = (credentials.email as string | undefined)
          ?.trim()
          .toLowerCase();
        const password = credentials.password as string | undefined;

        console.log("Login attempt:", { email, passwordLength: password?.length });

        if (!email || !password) {
          throw new Error("Email and password are required");
        }

        // Check rate limiting
        const rateLimit = await ctx.runQuery(
          internal.utils.rateLimit.checkLoginRateLimit,
          { email },
        );
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

        console.log("User found:", { userFound: !!user, hasPasswordHash: !!user?.passwordHash });

        if (!user) {
          await ctx.runMutation(
            internal.utils.rateLimit.recordLoginAttempt,
            { email, success: false },
          );
          throw new Error("Invalid email or password");
        }

        if (!user.passwordHash) {
          throw new Error(
            "Password not set. Contact admin to set up your password.",
          );
        }

        const isValid = verifyPassword(password, user.passwordHash);
        
        console.log("Password verification:", { 
          isValid, 
          providedPassword: password,
          hashPrefix: user.passwordHash?.substring(0, 30) 
        });

        if (!isValid) {
          await ctx.runMutation(
            internal.utils.rateLimit.recordLoginAttempt,
            { email, success: false },
          );
          throw new Error("Invalid email or password");
        }

        // Clear rate limit on successful login
        await ctx.runMutation(
          internal.utils.rateLimit.recordLoginAttempt,
          { email, success: true },
        );

        return { userId: user._id };
      },
    }),
  ],
});

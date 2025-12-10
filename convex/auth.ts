import Credentials from "@auth/core/providers/credentials";
import { convexAuth } from "@convex-dev/auth/server";
import { verifyPassword } from "./utils/password";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // @ts-expect-error - convex-auth passes ctx as second argument and expects userId return
      authorize: async (credentials, ctx) => {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) return null;

        // Query user directly from database instead of using runQuery with internal query
        const user = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", email))
          .unique();

        if (!user || !user.passwordHash) return null;

        const isValid = await verifyPassword(password, user.passwordHash);

        if (isValid) {
          return { userId: user._id };
        }
        return null;
      },
    }),
  ],
});

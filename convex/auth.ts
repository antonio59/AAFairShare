import Credentials from "@auth/core/providers/credentials";
import { convexAuth } from "@convex-dev/auth/server";
import { api } from "./_generated/api";
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

        const user = await ctx.runQuery(api.users.getUserByEmail, { email });

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

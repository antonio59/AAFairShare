import { getAuthUserId } from "@convex-dev/auth/server";
import { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server";

export async function requireAuthenticatedUser(
  ctx: QueryCtx | MutationCtx | ActionCtx
) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
}

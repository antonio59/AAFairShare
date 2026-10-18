import { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { ActivityAction } from "./activityFeed";

/**
 * Append one activity row. Callers own auth and validation; this only records
 * what already happened. Rows are never updated or deleted.
 */
export async function recordActivity(
  ctx: MutationCtx,
  entry: {
    action: ActivityAction;
    actorId?: Id<"users">;
    amount: number;
    description?: string;
    expenseId?: Id<"expenses">;
    settlementId?: Id<"settlements">;
    month?: string;
    fromUserId?: Id<"users">;
    toUserId?: Id<"users">;
    automatic?: boolean;
  },
): Promise<void> {
  const description = entry.description?.trim().slice(0, 500);

  await ctx.db.insert("activities", {
    action: entry.action,
    occurredAt: Date.now(),
    amount: entry.amount,
    ...(entry.actorId ? { actorId: entry.actorId } : {}),
    ...(description ? { description } : {}),
    ...(entry.expenseId ? { expenseId: entry.expenseId } : {}),
    ...(entry.settlementId ? { settlementId: entry.settlementId } : {}),
    ...(entry.month ? { month: entry.month } : {}),
    ...(entry.fromUserId ? { fromUserId: entry.fromUserId } : {}),
    ...(entry.toUserId ? { toUserId: entry.toUserId } : {}),
    ...(entry.automatic ? { automatic: true } : {}),
  });
}

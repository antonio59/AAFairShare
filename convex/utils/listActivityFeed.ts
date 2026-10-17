import { QueryCtx } from "../_generated/server";
import { requireAuthenticatedUser } from "./auth";
import { getUsersMap } from "./batchFetch";
import {
  DEFAULT_FEED_LIMIT,
  buildFeed,
  userDisplayName,
  type ActivitySource,
  type ExpenseSource,
  type SettlementSource,
} from "./activityFeed";

/** Newest-first household feed. Auth is required. No rows are written here. */
export async function listActivityFeed(ctx: QueryCtx) {
  await requireAuthenticatedUser(ctx);
  const limit = DEFAULT_FEED_LIMIT;

  const [activityRows, expenseRows, settlementRows, usersMap] = await Promise.all([
    ctx.db
      .query("activities")
      .withIndex("by_occurred_at")
      .order("desc")
      .take(limit),
    ctx.db.query("expenses").order("desc").take(limit),
    ctx.db.query("settlements").order("desc").take(limit),
    getUsersMap(ctx),
  ]);

  const names: Record<string, string> = {};
  for (const [id, user] of usersMap) {
    const name = userDisplayName(user);
    if (name) names[id] = name;
  }

  const expensesMissingAdd = (
    await Promise.all(
      expenseRows.map(async (expense) => {
        const logged = await ctx.db
          .query("activities")
          .withIndex("by_expense", (q) => q.eq("expenseId", expense._id))
          .take(8);
        const hasAdd = logged.some((row) => row.action === "expense.added");
        return hasAdd ? null : expense;
      }),
    )
  ).filter((expense): expense is (typeof expenseRows)[number] => expense !== null);

  const settlementsMissingRecord = (
    await Promise.all(
      settlementRows.map(async (settlement) => {
        const logged = await ctx.db
          .query("activities")
          .withIndex("by_settlement", (q) => q.eq("settlementId", settlement._id))
          .take(8);
        const hasRecord = logged.some((row) => row.action === "settlement.recorded");
        return hasRecord ? null : settlement;
      }),
    )
  ).filter(
    (settlement): settlement is (typeof settlementRows)[number] => settlement !== null,
  );

  const activities: ActivitySource[] = activityRows.map((row) => ({
    _id: row._id,
    action: row.action,
    actorId: row.actorId,
    occurredAt: row.occurredAt,
    amount: row.amount,
    description: row.description,
    expenseId: row.expenseId,
    settlementId: row.settlementId,
    month: row.month,
    fromUserId: row.fromUserId,
    toUserId: row.toUserId,
    automatic: row.automatic,
  }));

  const expenses: ExpenseSource[] = expensesMissingAdd.map((expense) => ({
    _id: expense._id,
    _creationTime: expense._creationTime,
    amount: expense.amount,
    description: expense.description,
  }));

  const settlements: SettlementSource[] = settlementsMissingRecord.map((settlement) => ({
    _id: settlement._id,
    _creationTime: settlement._creationTime,
    amount: settlement.amount,
    month: settlement.month,
    fromUserId: settlement.fromUserId,
    toUserId: settlement.toUserId,
    recordedBy: settlement.recordedBy,
  }));

  return buildFeed({ activities, expenses, settlements, names }, limit);
}

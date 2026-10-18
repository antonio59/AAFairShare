import { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import {
  actionKind,
  buildSearchText,
  formatMonthLabel,
  userDisplayName,
  type ActivityAction,
} from "./activityFeed";

/**
 * Append one activity row. Callers own auth and validation; this only records
 * what already happened. Rows are never updated or deleted.
 *
 * `occurredAt` defaults to now. Pass an older timestamp only when snapshotting
 * an event that predates the log, so the original line keeps its place.
 */
export async function recordActivity(
  ctx: MutationCtx,
  entry: {
    action: ActivityAction;
    actorId?: Id<"users">;
    amount?: number;
    description?: string;
    expenseId?: Id<"expenses">;
    settlementId?: Id<"settlements">;
    documentId?: Id<"documents">;
    goalId?: Id<"savingsGoals">;
    contributionId?: Id<"savingsContributions">;
    month?: string;
    fromUserId?: Id<"users">;
    toUserId?: Id<"users">;
    automatic?: boolean;
    occurredAt?: number;
    category?: string;
    location?: string;
    categoryId?: Id<"categories">;
    locationId?: Id<"locations">;
  },
): Promise<void> {
  const description = entry.description?.trim().slice(0, 500);
  const automatic = entry.automatic === true;
  const kind = actionKind(entry.action) ?? undefined;

  let category = entry.category?.trim();
  let location = entry.location?.trim();
  if (!category && entry.categoryId) {
    const row = await ctx.db.get(entry.categoryId);
    category = row?.name?.trim();
  }
  if (!location && entry.locationId) {
    const row = await ctx.db.get(entry.locationId);
    location = row?.name?.trim();
  }

  let actorName: string | null = null;
  if (entry.actorId && !automatic) {
    const actor = await ctx.db.get(entry.actorId);
    actorName = userDisplayName(actor);
  }

  const searchBits = [description ?? ""];
  if (entry.month) searchBits.push(formatMonthLabel(entry.month));
  if (entry.fromUserId) {
    const fromUser = await ctx.db.get(entry.fromUserId);
    const fromName = userDisplayName(fromUser);
    if (fromName) searchBits.push(fromName);
  }
  if (entry.toUserId) {
    const toUser = await ctx.db.get(entry.toUserId);
    const toName = userDisplayName(toUser);
    if (toName) searchBits.push(toName);
  }

  const searchText = buildSearchText({
    description: searchBits.join(" "),
    actorName,
    category,
    location,
    amount: entry.amount ?? null,
  });

  await ctx.db.insert("activities", {
    action: entry.action,
    occurredAt: entry.occurredAt ?? Date.now(),
    ...(entry.amount != null ? { amount: entry.amount } : {}),
    ...(entry.actorId && !automatic ? { actorId: entry.actorId } : {}),
    ...(description ? { description } : {}),
    ...(entry.expenseId ? { expenseId: entry.expenseId } : {}),
    ...(entry.settlementId ? { settlementId: entry.settlementId } : {}),
    ...(entry.documentId ? { documentId: entry.documentId } : {}),
    ...(entry.goalId ? { goalId: entry.goalId } : {}),
    ...(entry.contributionId ? { contributionId: entry.contributionId } : {}),
    ...(entry.month ? { month: entry.month } : {}),
    ...(entry.fromUserId ? { fromUserId: entry.fromUserId } : {}),
    ...(entry.toUserId ? { toUserId: entry.toUserId } : {}),
    ...(automatic ? { automatic: true } : {}),
    ...(kind ? { kind } : {}),
    ...(category ? { category } : {}),
    ...(location ? { location } : {}),
    ...(searchText ? { searchText } : {}),
  });
}

export async function settlementHasRecordedLog(
  ctx: MutationCtx,
  settlementId: Id<"settlements">,
): Promise<boolean> {
  const rows = await ctx.db
    .query("activities")
    .withIndex("by_settlement", (q) => q.eq("settlementId", settlementId))
    .take(8);
  return rows.some((row) => row.action === "settlement.recorded");
}

export async function documentHasAddedLog(
  ctx: MutationCtx,
  documentId: Id<"documents">,
): Promise<boolean> {
  const rows = await ctx.db
    .query("activities")
    .withIndex("by_document", (q) => q.eq("documentId", documentId))
    .take(8);
  return rows.some((row) => row.action === "document.added");
}

export async function goalHasAddedLog(
  ctx: MutationCtx,
  goalId: Id<"savingsGoals">,
): Promise<boolean> {
  const rows = await ctx.db
    .query("activities")
    .withIndex("by_goal", (q) => q.eq("goalId", goalId))
    .take(8);
  return rows.some((row) => row.action === "goal.added");
}

export async function contributionHasLog(
  ctx: MutationCtx,
  contributionId: Id<"savingsContributions">,
): Promise<boolean> {
  const rows = await ctx.db
    .query("activities")
    .withIndex("by_contribution", (q) => q.eq("contributionId", contributionId))
    .take(8);
  return rows.some((row) => row.action === "goal.contribution");
}

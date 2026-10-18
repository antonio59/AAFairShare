import { QueryCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";
import { requireAuthenticatedUser } from "./auth";
import {
  batchGetByIds,
  getCategoriesMap,
  getLocationsMap,
  getUsersMap,
} from "./batchFetch";
import {
  DEFAULT_FEED_LIMIT,
  KIND_FILTER_LIMIT,
  TEXT_SCAN_LIMIT,
  actionsForKind,
  buildFeed,
  feedItemMatches,
  filterFeedItems,
  isAutoContributionNote,
  parseFeedKind,
  searchIndexQuery,
  userDisplayName,
  type ActivitySource,
  type ContributionSource,
  type DocumentSource,
  type ExpenseSource,
  type FeedItem,
  type FeedKind,
  type GoalSource,
  type SettlementSource,
} from "./activityFeed";

const SEARCH_INDEX_LIMIT = 80;

export interface ActivityFeedArgs {
  search?: string;
  kind?: string;
}

/**
 * Newest-first household feed.
 *
 * The default view is the latest 200 logged rows, plus expenses, settlements,
 * documents, goals, and contributions that have no matching log line.
 *
 * Search and type filters read wider than that window:
 * - A type filter uses `by_action_and_occurred_at`, so the newest settlements
 *   are not hidden behind a run of expenses.
 * - Text search uses the `search_text` index for rows written with `searchText`
 *   (those matches can be older than the scan window) and a substring scan of
 *   the newest 1,000 activity rows plus recent source rows. Amount text and
 *   rows from before `searchText` existed still match the scan.
 *   Rows older than that scan, with no `searchText`, are not backfilled.
 */
export async function listActivityFeed(ctx: QueryCtx, args: ActivityFeedArgs = {}) {
  await requireAuthenticatedUser(ctx);

  const search = args.search?.trim() ?? "";
  const kind = parseFeedKind(args.kind);
  const filtering = search.length > 0 || kind !== null;

  const [usersMap, categoriesMap, locationsMap] = await Promise.all([
    getUsersMap(ctx),
    getCategoriesMap(ctx),
    getLocationsMap(ctx),
  ]);

  const names: Record<string, string> = {};
  for (const [id, user] of usersMap) {
    const name = userDisplayName(user);
    if (name) names[id] = name;
  }

  const categoryName = (id: Id<"categories"> | undefined) =>
    id ? categoriesMap.get(id)?.name : undefined;
  const locationName = (id: Id<"locations"> | undefined) =>
    id ? locationsMap.get(id)?.name : undefined;

  const activityRows = await loadActivities(ctx, search, kind);
  const activities = activityRows.map(toActivitySource);

  const sourceLimit = !filtering
    ? DEFAULT_FEED_LIMIT
    : search
      ? TEXT_SCAN_LIMIT
      : KIND_FILTER_LIMIT;

  const want = (next: FeedKind) => kind === null || kind === next;

  const [expenses, settlements, documents, goals, contributions] = await Promise.all([
    want("expense")
      ? loadExpenses(ctx, sourceLimit, search, categoryName, locationName)
      : [],
    want("settlement") ? loadSettlements(ctx, sourceLimit, search, names) : [],
    want("document") ? loadDocuments(ctx, sourceLimit, search, names) : [],
    want("goal") ? loadGoals(ctx, sourceLimit, search) : [],
    want("goal") ? loadContributions(ctx, sourceLimit, search, names) : [],
  ]);

  const assembled = buildFeed(
    { activities, expenses, settlements, documents, goals, contributions, names },
    filtering ? Number.POSITIVE_INFINITY : DEFAULT_FEED_LIMIT,
  );

  if (!filtering) return assembled;
  return filterFeedItems(assembled, search, kind).slice(0, DEFAULT_FEED_LIMIT);
}

async function loadActivities(
  ctx: QueryCtx,
  search: string,
  kind: FeedKind | null,
): Promise<Doc<"activities">[]> {
  const filtering = search.length > 0 || kind !== null;
  const batches: Doc<"activities">[][] = [];

  if (!filtering) {
    batches.push(
      await ctx.db.query("activities").withIndex("by_occurred_at").order("desc").take(DEFAULT_FEED_LIMIT),
    );
  } else if (kind) {
    const rows = await Promise.all(
      actionsForKind(kind).map((action) =>
        ctx.db
          .query("activities")
          .withIndex("by_action_and_occurred_at", (q) => q.eq("action", action))
          .order("desc")
          .take(KIND_FILTER_LIMIT),
      ),
    );
    batches.push(...rows);
  } else {
    batches.push(
      await ctx.db.query("activities").withIndex("by_occurred_at").order("desc").take(TEXT_SCAN_LIMIT),
    );
  }

  const indexQuery = searchIndexQuery(search);
  if (indexQuery) {
    batches.push(
      await ctx.db
        .query("activities")
        .withSearchIndex("search_text", (q) => {
          const searched = q.search("searchText", indexQuery);
          return kind ? searched.eq("kind", kind) : searched;
        })
        .take(SEARCH_INDEX_LIMIT),
    );
  }

  const byId = new Map<string, Doc<"activities">>();
  for (const batch of batches) {
    for (const row of batch) byId.set(row._id, row);
  }
  return [...byId.values()];
}

function toActivitySource(row: Doc<"activities">): ActivitySource {
  return {
    _id: row._id,
    action: row.action,
    actorId: row.actorId,
    occurredAt: row.occurredAt,
    amount: row.amount,
    description: row.description,
    expenseId: row.expenseId,
    settlementId: row.settlementId,
    documentId: row.documentId,
    goalId: row.goalId,
    contributionId: row.contributionId,
    month: row.month,
    fromUserId: row.fromUserId,
    toUserId: row.toUserId,
    automatic: row.automatic,
    category: row.category,
    location: row.location,
    searchText: row.searchText,
  };
}

function matchesCandidate(search: string, partial: Omit<FeedItem, "id" | "derived">): boolean {
  if (!search) return true;
  return feedItemMatches(
    {
      id: "candidate",
      derived: true,
      ...partial,
    },
    search,
  );
}

async function loadExpenses(
  ctx: QueryCtx,
  limit: number,
  search: string,
  categoryName: (id: Id<"categories"> | undefined) => string | undefined,
  locationName: (id: Id<"locations"> | undefined) => string | undefined,
): Promise<ExpenseSource[]> {
  const rows = await ctx.db.query("expenses").order("desc").take(limit);
  const candidates = rows.filter((expense) =>
    matchesCandidate(search, {
      action: "expense.added",
      actorId: null,
      actorName: null,
      amount: expense.amount,
      description: expense.description?.trim() || "Expense",
      occurredAt: expense._creationTime,
      automatic: false,
      category: categoryName(expense.categoryId),
      location: locationName(expense.locationId),
    }),
  );

  const missing = (
    await Promise.all(
      candidates.map(async (expense) => {
        const logged = await ctx.db
          .query("activities")
          .withIndex("by_expense", (q) => q.eq("expenseId", expense._id))
          .take(8);
        return logged.some((row) => row.action === "expense.added") ? null : expense;
      }),
    )
  ).filter((expense): expense is (typeof rows)[number] => expense !== null);

  return missing.map((expense) => ({
    _id: expense._id,
    _creationTime: expense._creationTime,
    amount: expense.amount,
    description: expense.description,
    category: categoryName(expense.categoryId),
    location: locationName(expense.locationId),
  }));
}

async function loadSettlements(
  ctx: QueryCtx,
  limit: number,
  search: string,
  names: Readonly<Record<string, string>>,
): Promise<SettlementSource[]> {
  const rows = await ctx.db.query("settlements").order("desc").take(limit);
  const candidates = rows.filter((settlement) => {
    const actorName = names[settlement.recordedBy] ?? null;
    const from = names[settlement.fromUserId] ?? "";
    const to = names[settlement.toUserId] ?? "";
    return matchesCandidate(search, {
      action: "settlement.recorded",
      actorId: settlement.recordedBy,
      actorName,
      amount: settlement.amount,
      description: `${from} paid ${to} ${settlement.month}`,
      occurredAt: settlement._creationTime,
      automatic: false,
    });
  });

  const missing = (
    await Promise.all(
      candidates.map(async (settlement) => {
        const logged = await ctx.db
          .query("activities")
          .withIndex("by_settlement", (q) => q.eq("settlementId", settlement._id))
          .take(8);
        return logged.some((row) => row.action === "settlement.recorded") ? null : settlement;
      }),
    )
  ).filter((settlement): settlement is (typeof rows)[number] => settlement !== null);

  return missing.map((settlement) => ({
    _id: settlement._id,
    _creationTime: settlement._creationTime,
    amount: settlement.amount,
    month: settlement.month,
    fromUserId: settlement.fromUserId,
    toUserId: settlement.toUserId,
    recordedBy: settlement.recordedBy,
  }));
}

async function loadDocuments(
  ctx: QueryCtx,
  limit: number,
  search: string,
  names: Readonly<Record<string, string>>,
): Promise<DocumentSource[]> {
  const rows = await ctx.db.query("documents").order("desc").take(limit);
  const candidates = rows.filter((doc) => {
    const actorId = doc.uploadedBy ?? null;
    return matchesCandidate(search, {
      action: "document.added",
      actorId,
      actorName: actorId ? (names[actorId] ?? null) : null,
      amount: doc.amount ?? null,
      description: doc.title?.trim() || doc.type?.trim() || "Document",
      occurredAt: doc._creationTime,
      automatic: false,
      category: doc.category,
      location: doc.location,
    });
  });

  const missing = (
    await Promise.all(
      candidates.map(async (doc) => {
        const logged = await ctx.db
          .query("activities")
          .withIndex("by_document", (q) => q.eq("documentId", doc._id))
          .take(8);
        return logged.some((row) => row.action === "document.added") ? null : doc;
      }),
    )
  ).filter((doc): doc is (typeof rows)[number] => doc !== null);

  return missing.map((doc) => ({
    _id: doc._id,
    _creationTime: doc._creationTime,
    title: doc.title,
    type: doc.type,
    amount: doc.amount,
    uploadedBy: doc.uploadedBy,
    category: doc.category,
    location: doc.location,
  }));
}

async function loadGoals(ctx: QueryCtx, limit: number, search: string): Promise<GoalSource[]> {
  const rows = await ctx.db.query("savingsGoals").order("desc").take(limit);
  const candidates = rows.filter((goal) =>
    matchesCandidate(search, {
      action: "goal.added",
      actorId: null,
      actorName: null,
      amount: goal.targetAmount,
      description: goal.name,
      occurredAt: goal._creationTime,
      automatic: false,
    }),
  );

  const missing = (
    await Promise.all(
      candidates.map(async (goal) => {
        const logged = await ctx.db
          .query("activities")
          .withIndex("by_goal", (q) => q.eq("goalId", goal._id))
          .take(8);
        return logged.some((row) => row.action === "goal.added") ? null : goal;
      }),
    )
  ).filter((goal): goal is (typeof rows)[number] => goal !== null);

  return missing.map((goal) => ({
    _id: goal._id,
    _creationTime: goal._creationTime,
    name: goal.name,
    targetAmount: goal.targetAmount,
    description: goal.description,
  }));
}

async function loadContributions(
  ctx: QueryCtx,
  limit: number,
  search: string,
  names: Readonly<Record<string, string>>,
): Promise<ContributionSource[]> {
  const rows = await ctx.db.query("savingsContributions").order("desc").take(limit);
  const goalMap = await batchGetByIds(
    ctx,
    "savingsGoals",
    rows.map((row) => row.goalId),
  );

  const candidates = rows.filter((contribution) => {
    const automatic = isAutoContributionNote(contribution.note);
    const actorId = automatic ? null : (contribution.contributorId ?? null);
    const goalName = goalMap.get(contribution.goalId)?.name?.trim() || "Savings goal";
    const note = contribution.note?.trim();
    const description =
      !automatic && note ? `${goalName} · ${note}` : goalName;
    return matchesCandidate(search, {
      action: "goal.contribution",
      actorId,
      actorName: actorId ? (names[actorId] ?? null) : null,
      amount: contribution.amount,
      description,
      occurredAt: contribution._creationTime,
      automatic,
    });
  });

  const missing = (
    await Promise.all(
      candidates.map(async (contribution) => {
        const logged = await ctx.db
          .query("activities")
          .withIndex("by_contribution", (q) => q.eq("contributionId", contribution._id))
          .take(8);
        return logged.some((row) => row.action === "goal.contribution") ? null : contribution;
      }),
    )
  ).filter((contribution): contribution is (typeof rows)[number] => contribution !== null);

  return missing.map((contribution) => ({
    _id: contribution._id,
    _creationTime: contribution._creationTime,
    amount: contribution.amount,
    contributorId: contribution.contributorId,
    goalName: goalMap.get(contribution.goalId)?.name,
    note: contribution.note,
  }));
}

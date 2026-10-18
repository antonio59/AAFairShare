/**
 * Pure activity-feed formatting, search, and assembly.
 *
 * The feed is newest-first. Logged rows come from the append-only `activities`
 * table. Expenses, settlements, documents, goals, and contributions that
 * predate a matching log row are shown from their creation timestamps.
 * Derived expenses have no actor: the schema stores who paid, not who logged.
 */

export const ACTIVITY_ACTIONS = [
  "expense.added",
  "expense.edited",
  "expense.deleted",
  "settlement.recorded",
  "settlement.removed",
  "document.added",
  "document.linked",
  "document.unlinked",
  "document.deleted",
  "goal.added",
  "goal.edited",
  "goal.deleted",
  "goal.contribution",
  "goal.contribution_edited",
  "goal.contribution_deleted",
] as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export const FEED_KINDS = ["expense", "settlement", "document", "goal"] as const;

export type FeedKind = (typeof FEED_KINDS)[number];

export const DEFAULT_FEED_LIMIT = 200;

/** How many rows of one action a type filter reads. Independent of the mixed feed window. */
export const KIND_FILTER_LIMIT = 200;

/** Newest activity rows scanned with a substring match, covering rows that predate searchText. */
export const TEXT_SCAN_LIMIT = 1000;

const LONDON = "Europe/London";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const ACTIONS_BY_KIND: Record<FeedKind, readonly ActivityAction[]> = {
  expense: ["expense.added", "expense.edited", "expense.deleted"],
  settlement: ["settlement.recorded", "settlement.removed"],
  document: [
    "document.added",
    "document.linked",
    "document.unlinked",
    "document.deleted",
  ],
  goal: [
    "goal.added",
    "goal.edited",
    "goal.deleted",
    "goal.contribution",
    "goal.contribution_edited",
    "goal.contribution_deleted",
  ],
};

export interface FeedItem {
  id: string;
  action: ActivityAction;
  actorId: string | null;
  actorName: string | null;
  amount: number | null;
  description: string;
  occurredAt: number;
  automatic: boolean;
  /** True when reconstructed from an existing row rather than the activity log. */
  derived: boolean;
  category?: string;
  location?: string;
  /** Stored search blob, so a later rename does not hide the old name. */
  searchText?: string;
}

export interface ActivitySource {
  _id: string;
  action: string;
  actorId?: string;
  occurredAt: number;
  amount?: number;
  description?: string;
  expenseId?: string;
  settlementId?: string;
  documentId?: string;
  goalId?: string;
  contributionId?: string;
  month?: string;
  fromUserId?: string;
  toUserId?: string;
  automatic?: boolean;
  category?: string;
  location?: string;
  searchText?: string;
}

export interface ExpenseSource {
  _id: string;
  _creationTime: number;
  amount: number;
  description?: string;
  category?: string;
  location?: string;
}

export interface SettlementSource {
  _id: string;
  _creationTime: number;
  amount: number;
  month: string;
  fromUserId: string;
  toUserId: string;
  recordedBy: string;
}

export interface DocumentSource {
  _id: string;
  _creationTime: number;
  title?: string;
  type?: string;
  amount?: number;
  uploadedBy?: string;
  category?: string;
  location?: string;
}

export interface GoalSource {
  _id: string;
  _creationTime: number;
  name: string;
  targetAmount: number;
  description?: string;
}

export interface ContributionSource {
  _id: string;
  _creationTime: number;
  amount: number;
  contributorId?: string;
  goalName?: string;
  note?: string;
}

export interface FeedDayGroup {
  key: string;
  label: string;
  items: FeedItem[];
}

const ACTION_SET = new Set<string>(ACTIVITY_ACTIONS);

export function isActivityAction(value: string): value is ActivityAction {
  return ACTION_SET.has(value);
}

export function actionKind(action: string): FeedKind | null {
  if (action.startsWith("expense.")) return "expense";
  if (action.startsWith("settlement.")) return "settlement";
  if (action.startsWith("document.")) return "document";
  if (action.startsWith("goal.")) return "goal";
  return null;
}

export function parseFeedKind(value: string | undefined | null): FeedKind | null {
  if (!value) return null;
  return (FEED_KINDS as readonly string[]).includes(value) ? (value as FeedKind) : null;
}

export function actionsForKind(kind: FeedKind): readonly ActivityAction[] {
  return ACTIONS_BY_KIND[kind];
}

export function userDisplayName(
  user:
    | { name?: string; username?: string; email?: string }
    | null
    | undefined,
): string | null {
  if (!user) return null;
  const name =
    user.name?.trim() ||
    user.username?.trim() ||
    user.email?.split("@")[0]?.trim();
  return name || null;
}

export function expenseNote(description: string | undefined): string {
  const trimmed = description?.trim();
  return trimmed ? trimmed : "Expense";
}

export function documentLabel(doc: {
  title?: string;
  type?: string;
} | null | undefined): string {
  const title = doc?.title?.trim();
  if (title) return title;
  const type = doc?.type?.trim();
  if (type) return type;
  return "Document";
}

export function documentLinkNote(
  doc: { title?: string; type?: string } | null | undefined,
  expenseDescription: string | undefined,
): string {
  return `${documentLabel(doc)} · ${expenseNote(expenseDescription)}`;
}

export function isAutoContributionNote(note: string | undefined): boolean {
  return note?.trim().toLowerCase().startsWith("auto-recurring") === true;
}

export function formatGbp(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

export function formatMonthLabel(month: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return month;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return month;
  return `${MONTHS[monthIndex]} ${year}`;
}

export function settlementNote(
  fromUserId: string | undefined,
  toUserId: string | undefined,
  month: string | undefined,
  names: Readonly<Record<string, string>>,
): string {
  if (!fromUserId || !toUserId) return "";
  const from = names[fromUserId] ?? "Someone";
  const to = names[toUserId] ?? "Someone";
  const monthLabel = month ? formatMonthLabel(month) : "";
  return monthLabel ? `${from} paid ${to} for ${monthLabel}` : `${from} paid ${to}`;
}

/** True when a delete or undo must first snapshot the original line. */
export function needsOriginalSnapshot(hasOriginalLog: boolean): boolean {
  return !hasOriginalLog;
}

/** True when undoing a settlement must also snapshot the original settled-up line. */
export function needsOriginalSettlementSnapshot(hasRecordedLog: boolean): boolean {
  return needsOriginalSnapshot(hasRecordedLog);
}

export function buildSearchText(input: {
  description?: string;
  actorName?: string | null;
  category?: string;
  location?: string;
  amount?: number | null;
}): string {
  const parts = [
    input.description?.trim() ?? "",
    input.actorName?.trim() ?? "",
    input.category?.trim() ?? "",
    input.location?.trim() ?? "",
  ];
  if (input.amount != null && Number.isFinite(input.amount)) {
    parts.push(String(input.amount), input.amount.toFixed(2), formatGbp(input.amount));
  }
  return parts
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(" ")
    .slice(0, 1000);
}

/**
 * Query string safe to send to the Convex search index.
 * Very short or punctuation-only queries stay on the substring scan.
 */
export function searchIndexQuery(raw: string): string | null {
  const cleaned = raw
    .trim()
    .replace(/[^\p{L}\p{N}.£\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length < 2) return null;
  return cleaned.slice(0, 200);
}

export function feedItemMatches(item: FeedItem, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  const amountBits: string[] = [];
  if (item.amount != null && Number.isFinite(item.amount)) {
    amountBits.push(
      formatGbp(item.amount).toLowerCase(),
      item.amount.toFixed(2),
      String(item.amount),
    );
  }
  const haystack = [
    item.description,
    item.actorName ?? "",
    item.category ?? "",
    item.location ?? "",
    item.searchText ?? "",
    ...amountBits,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export function filterFeedItems(
  items: FeedItem[],
  search: string,
  kind: FeedKind | null,
): FeedItem[] {
  return items.filter((item) => {
    if (kind && actionKind(item.action) !== kind) return false;
    return feedItemMatches(item, search);
  });
}

interface LondonParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function londonParts(timestamp: number): LondonParts {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(timestamp));
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");
  let hour = read("hour");
  if (hour === 24) hour = 0;
  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour,
    minute: read("minute"),
  };
}

const pad = (value: number) => String(value).padStart(2, "0");

/** London wall-clock time as a UTC epoch millisecond. */
export function londonWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): number {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const parts = londonParts(utcGuess);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
  );
  return utcGuess - (asUtc - utcGuess);
}

/** Hour and minute on a London calendar day relative to today. */
export function londonDaysFromToday(
  days: number,
  hour: number,
  minute: number,
  now = Date.now(),
): number {
  const today = londonParts(now);
  const shifted = londonParts(
    Date.UTC(today.year, today.month - 1, today.day + days, 12, 0, 0),
  );
  return londonWallTimeToUtc(shifted.year, shifted.month, shifted.day, hour, minute);
}

export function formatLondonDateTime(timestamp: number): string {
  const parts = londonParts(timestamp);
  return `${parts.day} ${MONTHS[parts.month - 1]} ${parts.year}, ${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function formatLondonTime(timestamp: number): string {
  const parts = londonParts(timestamp);
  return `${pad(parts.hour)}:${pad(parts.minute)}`;
}

function londonDayKey(timestamp: number): string {
  const parts = londonParts(timestamp);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function shiftLondonDay(timestamp: number, days: number): string {
  const parts = londonParts(timestamp);
  return londonDayKey(
    Date.UTC(parts.year, parts.month - 1, parts.day + days, 12, 0, 0),
  );
}

export function feedDayLabel(timestamp: number, now: number): string {
  const key = londonDayKey(timestamp);
  if (key === londonDayKey(now)) return "Today";
  if (key === shiftLondonDay(now, -1)) return "Yesterday";
  const parts = londonParts(timestamp);
  const nowParts = londonParts(now);
  const label = `${parts.day} ${MONTHS[parts.month - 1]}`;
  return parts.year === nowParts.year ? label : `${label} ${parts.year}`;
}

function moneyPrefix(amount: number | null): string {
  return amount == null ? "" : `${formatGbp(amount)} `;
}

export function formatActivitySentence(item: FeedItem): string {
  const when = formatLondonDateTime(item.occurredAt);
  const who = item.actorName ?? "Someone";
  const note = item.description.trim();
  const money = moneyPrefix(item.amount);

  switch (item.action) {
    case "expense.added":
      if (item.automatic) {
        return `A recurring bill added ${money}expense '${note || "Expense"}' on ${when}`;
      }
      return `${who} added ${money}expense '${note || "Expense"}' on ${when}`;
    case "expense.edited":
      return `${who} edited ${money}expense '${note || "Expense"}' on ${when}`;
    case "expense.deleted":
      return `${who} deleted ${money}expense '${note || "Expense"}' on ${when}`;
    case "settlement.recorded":
      return note
        ? `${who} settled up ${money.trim()} (${note}) on ${when}`
        : `${who} settled up ${money.trim()} on ${when}`;
    case "settlement.removed":
      return note
        ? `${who} removed a ${money.trim()} settlement (${note}) on ${when}`
        : `${who} removed a ${money.trim()} settlement on ${when}`;
    case "document.added":
      return `${who} uploaded ${money}document '${note || "Document"}' on ${when}`;
    case "document.linked":
      return `${who} linked document '${note || "Document"}' on ${when}`;
    case "document.unlinked":
      return `${who} unlinked document '${note || "Document"}' on ${when}`;
    case "document.deleted":
      return `${who} deleted ${money}document '${note || "Document"}' on ${when}`;
    case "goal.added":
      return `${who} created ${money}savings goal '${note || "Savings goal"}' on ${when}`;
    case "goal.edited":
      return `${who} edited ${money}savings goal '${note || "Savings goal"}' on ${when}`;
    case "goal.deleted":
      return `${who} deleted ${money}savings goal '${note || "Savings goal"}' on ${when}`;
    case "goal.contribution":
      if (item.automatic) {
        return `An automatic contribution added ${money}to '${note || "Savings goal"}' on ${when}`;
      }
      return `${who} contributed ${money}to '${note || "Savings goal"}' on ${when}`;
    case "goal.contribution_edited":
      return `${who} edited a ${money}contribution to '${note || "Savings goal"}' on ${when}`;
    case "goal.contribution_deleted":
      return `${who} removed a ${money}contribution to '${note || "Savings goal"}' on ${when}`;
  }
}

function personPhrase(isMine: boolean, name: string | null, phrase: string): string {
  if (isMine) return `You ${phrase}`;
  if (name) return `${name} ${phrase}`;
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

export function feedBubbleLabel(item: FeedItem, isMine: boolean): string {
  if (item.automatic && item.action === "expense.added") return "Added automatically";
  if (item.automatic && item.action === "goal.contribution") {
    return "Contributed automatically";
  }
  const who = isMine ? "You" : item.actorName;
  switch (item.action) {
    case "expense.added":
      return who ? `${who} added` : "Added";
    case "expense.edited":
      return who ? `${who} edited` : "Edited";
    case "expense.deleted":
      return who ? `${who} deleted` : "Deleted";
    case "settlement.recorded":
      return who ? `${who} settled up` : "Settled up";
    case "settlement.removed":
      return who ? `${who} removed a settlement` : "Settlement removed";
    case "document.added":
      return personPhrase(isMine, item.actorName, "uploaded");
    case "document.linked":
      return personPhrase(isMine, item.actorName, "linked");
    case "document.unlinked":
      return personPhrase(isMine, item.actorName, "unlinked");
    case "document.deleted":
      return personPhrase(isMine, item.actorName, "deleted a document");
    case "goal.added":
      return personPhrase(isMine, item.actorName, "added a goal");
    case "goal.edited":
      return personPhrase(isMine, item.actorName, "edited a goal");
    case "goal.deleted":
      return personPhrase(isMine, item.actorName, "deleted a goal");
    case "goal.contribution":
      return personPhrase(isMine, item.actorName, "contributed");
    case "goal.contribution_edited":
      return personPhrase(isMine, item.actorName, "edited a contribution");
    case "goal.contribution_deleted":
      return personPhrase(isMine, item.actorName, "removed a contribution");
  }
}

export function isStrikeThroughAction(action: ActivityAction): boolean {
  return (
    action === "expense.deleted" ||
    action === "settlement.removed" ||
    action === "document.deleted" ||
    action === "goal.deleted" ||
    action === "goal.contribution_deleted"
  );
}

export function showsAmount(item: FeedItem): item is FeedItem & { amount: number } {
  return item.amount != null && Number.isFinite(item.amount);
}

function activityToItem(
  activity: ActivitySource,
  names: Readonly<Record<string, string>>,
): FeedItem | null {
  if (!isActivityAction(activity.action)) return null;
  const actorName = activity.actorId ? (names[activity.actorId] ?? null) : null;
  const description =
    activity.action === "settlement.recorded" ||
    activity.action === "settlement.removed"
      ? settlementNote(
          activity.fromUserId,
          activity.toUserId,
          activity.month,
          names,
        ) || activity.description?.trim() || ""
      : activity.description?.trim() ||
        (activity.action.startsWith("document.")
          ? "Document"
          : activity.action.startsWith("goal.")
            ? "Savings goal"
            : "Expense");

  return {
    id: activity._id,
    action: activity.action,
    actorId: activity.actorId ?? null,
    actorName,
    amount: activity.amount ?? null,
    description,
    occurredAt: activity.occurredAt,
    automatic: activity.automatic === true,
    derived: false,
    category: activity.category,
    location: activity.location,
    searchText: activity.searchText,
  };
}

function compareNewest(a: FeedItem, b: FeedItem): number {
  return b.occurredAt - a.occurredAt || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0);
}

/**
 * Merge logged activity with rows that have no matching log entry.
 * Caller should pass only source rows that are not already covered by an
 * older log row outside this batch.
 */
export function buildFeed(
  input: {
    activities: ActivitySource[];
    expenses: ExpenseSource[];
    settlements: SettlementSource[];
    documents?: DocumentSource[];
    goals?: GoalSource[];
    contributions?: ContributionSource[];
    names: Readonly<Record<string, string>>;
  },
  limit = DEFAULT_FEED_LIMIT,
): FeedItem[] {
  const items: FeedItem[] = [];
  const expenseAdds = new Set<string>();
  const settlementRecords = new Set<string>();
  const documentAdds = new Set<string>();
  const goalAdds = new Set<string>();
  const contributionAdds = new Set<string>();

  for (const activity of input.activities) {
    if (activity.action === "expense.added" && activity.expenseId) {
      expenseAdds.add(activity.expenseId);
    }
    if (activity.action === "settlement.recorded" && activity.settlementId) {
      settlementRecords.add(activity.settlementId);
    }
    if (activity.action === "document.added" && activity.documentId) {
      documentAdds.add(activity.documentId);
    }
    if (activity.action === "goal.added" && activity.goalId) {
      goalAdds.add(activity.goalId);
    }
    if (activity.action === "goal.contribution" && activity.contributionId) {
      contributionAdds.add(activity.contributionId);
    }
    const item = activityToItem(activity, input.names);
    if (item) items.push(item);
  }

  for (const expense of input.expenses) {
    if (expenseAdds.has(expense._id)) continue;
    items.push({
      id: `derived-expense-${expense._id}`,
      action: "expense.added",
      actorId: null,
      actorName: null,
      amount: expense.amount,
      description: expenseNote(expense.description),
      occurredAt: expense._creationTime,
      automatic: false,
      derived: true,
      category: expense.category,
      location: expense.location,
    });
  }

  for (const settlement of input.settlements) {
    if (settlementRecords.has(settlement._id)) continue;
    items.push({
      id: `derived-settlement-${settlement._id}`,
      action: "settlement.recorded",
      actorId: settlement.recordedBy,
      actorName: input.names[settlement.recordedBy] ?? null,
      amount: settlement.amount,
      description: settlementNote(
        settlement.fromUserId,
        settlement.toUserId,
        settlement.month,
        input.names,
      ),
      occurredAt: settlement._creationTime,
      automatic: false,
      derived: true,
    });
  }

  for (const document of input.documents ?? []) {
    if (documentAdds.has(document._id)) continue;
    const actorId = document.uploadedBy ?? null;
    items.push({
      id: `derived-document-${document._id}`,
      action: "document.added",
      actorId,
      actorName: actorId ? (input.names[actorId] ?? null) : null,
      amount: document.amount ?? null,
      description: documentLabel(document),
      occurredAt: document._creationTime,
      automatic: false,
      derived: true,
      category: document.category,
      location: document.location,
    });
  }

  for (const goal of input.goals ?? []) {
    if (goalAdds.has(goal._id)) continue;
    items.push({
      id: `derived-goal-${goal._id}`,
      action: "goal.added",
      actorId: null,
      actorName: null,
      amount: goal.targetAmount,
      description: goal.name.trim() || "Savings goal",
      occurredAt: goal._creationTime,
      automatic: false,
      derived: true,
    });
  }

  for (const contribution of input.contributions ?? []) {
    if (contributionAdds.has(contribution._id)) continue;
    const automatic = isAutoContributionNote(contribution.note);
    const actorId = automatic ? null : (contribution.contributorId ?? null);
    const goalName = contribution.goalName?.trim() || "Savings goal";
    const note = contribution.note?.trim();
    const description =
      !automatic && note && !isAutoContributionNote(note)
        ? `${goalName} · ${note}`
        : goalName;
    items.push({
      id: `derived-contribution-${contribution._id}`,
      action: "goal.contribution",
      actorId,
      actorName: actorId ? (input.names[actorId] ?? null) : null,
      amount: contribution.amount,
      description,
      occurredAt: contribution._creationTime,
      automatic,
      derived: true,
    });
  }

  items.sort(compareNewest);
  return items.slice(0, Math.max(0, limit));
}

export function groupFeedByDay(items: FeedItem[], now: number): FeedDayGroup[] {
  const sorted = [...items].sort((a, b) => b.occurredAt - a.occurredAt);
  const groups: FeedDayGroup[] = [];
  for (const item of sorted) {
    const key = londonDayKey(item.occurredAt);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(item);
    } else {
      groups.push({
        key,
        label: feedDayLabel(item.occurredAt, now),
        items: [item],
      });
    }
  }
  return groups;
}

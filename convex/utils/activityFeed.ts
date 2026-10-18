/**
 * Pure activity-feed formatting and assembly.
 *
 * The feed is newest-first. Logged rows come from the append-only `activities`
 * table. Expenses and settlements that predate that table are shown as derived
 * "added" / "settled up" events from their Convex creation timestamps.
 * Derived expenses have no actor: the schema stores who paid, not who logged.
 */

export const ACTIVITY_ACTIONS = [
  "expense.added",
  "expense.edited",
  "expense.deleted",
  "settlement.recorded",
  "settlement.removed",
] as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export const DEFAULT_FEED_LIMIT = 200;

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

export interface FeedItem {
  id: string;
  action: ActivityAction;
  actorId: string | null;
  actorName: string | null;
  amount: number;
  description: string;
  occurredAt: number;
  automatic: boolean;
  /** True when reconstructed from an existing row rather than the activity log. */
  derived: boolean;
}

export interface ActivitySource {
  _id: string;
  action: string;
  actorId?: string;
  occurredAt: number;
  amount: number;
  description?: string;
  expenseId?: string;
  settlementId?: string;
  month?: string;
  fromUserId?: string;
  toUserId?: string;
  automatic?: boolean;
}

export interface ExpenseSource {
  _id: string;
  _creationTime: number;
  amount: number;
  description?: string;
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

export interface FeedDayGroup {
  key: string;
  label: string;
  items: FeedItem[];
}

const ACTION_SET = new Set<string>(ACTIVITY_ACTIONS);

export function isActivityAction(value: string): value is ActivityAction {
  return ACTION_SET.has(value);
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

export function formatActivitySentence(item: FeedItem): string {
  const when = formatLondonDateTime(item.occurredAt);
  const money = formatGbp(item.amount);
  const who = item.actorName ?? "Someone";
  const note = item.description.trim() || "Expense";

  switch (item.action) {
    case "expense.added":
      if (item.automatic) {
        return `A recurring bill added ${money} expense '${note}' on ${when}`;
      }
      return `${who} added ${money} expense '${note}' on ${when}`;
    case "expense.edited":
      return `${who} edited ${money} expense '${note}' on ${when}`;
    case "expense.deleted":
      return `${who} deleted ${money} expense '${note}' on ${when}`;
    case "settlement.recorded":
      return item.description.trim()
        ? `${who} settled up ${money} (${item.description.trim()}) on ${when}`
        : `${who} settled up ${money} on ${when}`;
    case "settlement.removed":
      return item.description.trim()
        ? `${who} removed a ${money} settlement (${item.description.trim()}) on ${when}`
        : `${who} removed a ${money} settlement on ${when}`;
  }
}

export function feedBubbleLabel(item: FeedItem, isMine: boolean): string {
  if (item.automatic && item.action === "expense.added") {
    return "Added automatically";
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
  }
}

export function isStrikeThroughAction(action: ActivityAction): boolean {
  return action === "expense.deleted" || action === "settlement.removed";
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
      : expenseNote(activity.description);

  return {
    id: activity._id,
    action: activity.action,
    actorId: activity.actorId ?? null,
    actorName,
    amount: activity.amount,
    description,
    occurredAt: activity.occurredAt,
    automatic: activity.automatic === true,
    derived: false,
  };
}

/**
 * Merge logged activity with expenses and settlements that have no matching
 * log row. Caller should pass only expenses/settlements that are not already
 * covered by an older log row outside this batch.
 */
export function buildFeed(
  input: {
    activities: ActivitySource[];
    expenses: ExpenseSource[];
    settlements: SettlementSource[];
    names: Readonly<Record<string, string>>;
  },
  limit = DEFAULT_FEED_LIMIT,
): FeedItem[] {
  const items: FeedItem[] = [];
  const expenseAdds = new Set<string>();
  const settlementRecords = new Set<string>();

  for (const activity of input.activities) {
    if (activity.action === "expense.added" && activity.expenseId) {
      expenseAdds.add(activity.expenseId);
    }
    if (activity.action === "settlement.recorded" && activity.settlementId) {
      settlementRecords.add(activity.settlementId);
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

  items.sort(
    (a, b) => b.occurredAt - a.occurredAt || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0),
  );
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

import type { MonthTotals } from "./settlement";
import { formatPounds } from "./money";

export type SettlementDirection = MonthTotals["settlementDirection"];

export interface PlannedSettlement {
  amount: number;
  fromUserId: string;
  toUserId: string;
  direction: SettlementDirection;
}

/**
 * The payment the server records. Client amount and direction are ignored;
 * this is derived only from computeMonthTotals.
 * An even month stores £0 from user1 to user2 so the row still has both ids.
 */
export function plannedSettlement<T extends string>(
  totals: Pick<MonthTotals, "settlement" | "settlementDirection">,
  user1Id: T,
  user2Id: T,
): Omit<PlannedSettlement, "fromUserId" | "toUserId"> & {
  fromUserId: T;
  toUserId: T;
} {
  if (totals.settlementDirection === "owes") {
    return {
      amount: totals.settlement,
      fromUserId: user1Id,
      toUserId: user2Id,
      direction: "owes",
    };
  }
  if (totals.settlementDirection === "owed") {
    return {
      amount: totals.settlement,
      fromUserId: user2Id,
      toUserId: user1Id,
      direction: "owed",
    };
  }
  return {
    amount: 0,
    fromUserId: user1Id,
    toUserId: user2Id,
    direction: "even",
  };
}

export function householdDisplayName(
  user: { username?: string | null; name?: string | null } | null | undefined,
  fallback: string,
): string {
  const username = user?.username?.trim();
  const name = user?.name?.trim();
  return username || name || fallback;
}

export function headlineFor(
  amount: number,
  direction: SettlementDirection,
  user1Name: string,
  user2Name: string,
): string {
  if (direction === "even" || Math.round(amount * 100) === 0) return "All square";
  if (direction === "owes") {
    return `${user1Name} owes ${user2Name} ${formatPounds(amount)}`;
  }
  return `${user2Name} owes ${user1Name} ${formatPounds(amount)}`;
}

export interface MonthSnapshot {
  month: string;
  totals: MonthTotals;
  settled: boolean;
}

export interface OpenMonth {
  month: string;
  amount: number;
  direction: SettlementDirection;
}

/**
 * Months that have expenses and no settlement row.
 * netPence is signed: positive means user1 owes user2 across those months.
 */
export function summariseUnsettledMonths(months: MonthSnapshot[]): {
  months: OpenMonth[];
  netPence: number;
} {
  const open = months
    .filter((month) => !month.settled && month.totals.totalExpenses > 0)
    .sort((a, b) => a.month.localeCompare(b.month));

  let netPence = 0;
  for (const month of open) {
    const pence = Math.round(month.totals.settlement * 100);
    if (month.totals.settlementDirection === "owes") netPence += pence;
    else if (month.totals.settlementDirection === "owed") netPence -= pence;
  }

  return {
    months: open.map((month) => ({
      month: month.month,
      amount: month.totals.settlement,
      direction: month.totals.settlementDirection,
    })),
    netPence,
  };
}

export function netDirection(netPence: number): SettlementDirection {
  if (netPence > 0) return "owes";
  if (netPence < 0) return "owed";
  return "even";
}

/**
 * True when the live computeMonthTotals result no longer matches the
 * payment that was stored on the settlement row.
 * A £0 recorded row matches an even month regardless of which user id was stored.
 */
export function settlementHasDrift<T extends string>(
  totals: Pick<MonthTotals, "settlement" | "settlementDirection">,
  recorded: { amount: number; fromUserId: T },
  user1Id: T,
  user2Id: T,
): boolean {
  const planned = plannedSettlement(totals, user1Id, user2Id);
  const recordedPence = Math.round(recorded.amount * 100);
  const plannedPence = Math.round(planned.amount * 100);
  if (recordedPence === 0 && plannedPence === 0) return false;
  return recordedPence !== plannedPence || planned.fromUserId !== recorded.fromUserId;
}

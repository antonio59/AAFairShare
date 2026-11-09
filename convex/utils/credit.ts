/**
 * Pure maths for shared refund credits.
 *
 * A credit of R pence is held by one user, and half of it belongs to the
 * other user. Each allocation of A pence from the credit to a bill adds about
 * A/2 to what the holder owes the other user in that bill's month.
 *
 * Halving each allocation on its own would leak pennies (three odd
 * allocations would each round), so the adjustment is computed from the
 * running total drawn from the credit:
 *   half(cumulativeAfter) - half(cumulativeBefore)
 * Over all allocations of a credit these telescope to exactly half(R).
 */

/** Half of a pence amount, rounded down. The holder keeps an odd penny. */
export function halfPence(pence: number): number {
  return Math.floor(pence / 2);
}

/**
 * Pence added to what the holder owes for one allocation.
 * `allocatedBeforePence` is the total already drawn from the same credit by
 * earlier allocations, in allocation order.
 */
export function adjustmentPenceFor(
  allocationPence: number,
  allocatedBeforePence = 0,
): number {
  return (
    halfPence(allocatedBeforePence + allocationPence) -
    halfPence(allocatedBeforePence)
  );
}

/** The only category group that can draw on a credit. */
export const HOUSEHOLD_BILLS_GROUP = "household-bills";
export const CATEGORY_GROUPS = [HOUSEHOLD_BILLS_GROUP] as const;
export type CategoryGroup = (typeof CATEGORY_GROUPS)[number];

export const toPence = (pounds: number) => Math.round(pounds * 100);

export interface StoredAllocation {
  pence: number;
  /** Pence this allocation added to what the holder owes, fixed when written. */
  adjustmentPence: number;
}

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

/**
 * Adjustment for a new or resized allocation, given the credit's other live
 * allocations. It is half(drawn after) minus what the others already
 * recorded, which equals adjustmentPenceFor when nothing has been released.
 *
 * Adjustments are stored rather than recomputed from allocation order, so
 * releasing an older allocation never moves a settled month. A release can
 * leave the recorded total a penny away from half(drawn); the next write
 * corrects it, and once the credit is fully drawn the total is exactly half(R).
 */
export function adjustmentForAllocation(
  others: StoredAllocation[],
  pence: number,
): number {
  const drawn = sum(others.map((allocation) => allocation.pence));
  const recorded = sum(others.map((allocation) => allocation.adjustmentPence));
  return halfPence(drawn + pence) - recorded;
}

export interface CreditBalance {
  allocatedPence: number;
  remainingPence: number;
  /** What the other person is still owed from the credit if it were cashed out now. */
  othersShareRemainingPence: number;
}

export function creditBalance(
  amountPence: number,
  allocations: StoredAllocation[],
): CreditBalance {
  const allocatedPence = sum(allocations.map((allocation) => allocation.pence));
  const recorded = sum(allocations.map((allocation) => allocation.adjustmentPence));
  return {
    allocatedPence,
    remainingPence: amountPence - allocatedPence,
    othersShareRemainingPence: halfPence(amountPence) - recorded,
  };
}

export type AllocationPlan =
  | { ok: true; pence: number }
  | { ok: false; reason: string };

export interface CreditState {
  amountPence: number;
  receivedOn: string;
  closed: boolean;
  /** Total already drawn from this credit. */
  allocatedPence: number;
  holderInHousehold: boolean;
}

export interface BillState {
  pence: number;
  date: string;
  month: string;
  split: string;
  inHouseholdBills: boolean;
  /** Total already drawn onto this bill from every credit. */
  allocatedPence: number;
  alreadyUsesThisCredit: boolean;
  monthSettled: boolean;
}

/** Whether a bill can draw on a credit at all, ignoring amounts. */
export function billIneligibleReason(
  credit: Pick<CreditState, "receivedOn">,
  bill: Pick<BillState, "date" | "split" | "inHouseholdBills">,
): string | null {
  if (bill.split !== "50/50") return "Only 50/50 expenses can use a refund credit";
  if (!bill.inHouseholdBills) {
    return "Only expenses in a household-bill category can use a refund credit";
  }
  if (bill.date < credit.receivedOn) {
    return `Only bills dated on or after ${credit.receivedOn} can use this credit`;
  }
  return null;
}

/**
 * How much of a credit one bill can draw. Defaults to as much as both the
 * credit and the bill allow; a requested amount must fit within that.
 */
export function planBillAllocation(
  credit: CreditState,
  bill: BillState,
  requestedPence?: number,
): AllocationPlan {
  if (credit.closed) return { ok: false, reason: "This credit is closed" };
  if (!credit.holderInHousehold) {
    return { ok: false, reason: "The person holding this credit is not in the household" };
  }
  const ineligible = billIneligibleReason(credit, bill);
  if (ineligible) return { ok: false, reason: ineligible };
  if (bill.monthSettled) {
    return { ok: false, reason: `Unsettle ${bill.month} first` };
  }
  if (bill.alreadyUsesThisCredit) {
    return { ok: false, reason: "This bill already uses this credit" };
  }
  const remaining = credit.amountPence - credit.allocatedPence;
  if (remaining <= 0) return { ok: false, reason: "Nothing is left on this credit" };
  const uncovered = bill.pence - bill.allocatedPence;
  if (uncovered <= 0) {
    return { ok: false, reason: "This bill is already fully covered by credit" };
  }
  const available = Math.min(remaining, uncovered);
  if (requestedPence === undefined) return { ok: true, pence: available };
  if (!Number.isInteger(requestedPence) || requestedPence <= 0) {
    return { ok: false, reason: "amount must be a positive number" };
  }
  if (requestedPence > available) {
    return {
      ok: false,
      reason: `Only £${(available / 100).toFixed(2)} of this credit can go on this bill`,
    };
  }
  return { ok: true, pence: requestedPence };
}

export interface CandidateCredit extends CreditState {
  id: string;
}

export interface PlannedDraw {
  id: string;
  pence: number;
}

const byReceivedOn = <T extends { receivedOn: string }>(rows: T[]) =>
  [...rows].sort((a, b) => (a.receivedOn < b.receivedOn ? -1 : a.receivedOn > b.receivedOn ? 1 : 0));

/**
 * Automatic use on one bill: the oldest credit first, then the next, until
 * the bill is covered. Credits arrive in creation order, so the stable sort
 * breaks same-day ties by which was recorded first. `usedCreditIds` are the
 * credits already on this bill.
 */
export function planAutoAllocations(
  credits: CandidateCredit[],
  bill: Omit<BillState, "alreadyUsesThisCredit">,
  usedCreditIds: ReadonlySet<string> = new Set(),
): PlannedDraw[] {
  const draws: PlannedDraw[] = [];
  let allocatedPence = bill.allocatedPence;
  for (const credit of byReceivedOn(credits)) {
    if (allocatedPence >= bill.pence) break;
    const plan = planBillAllocation(credit, {
      ...bill,
      allocatedPence,
      alreadyUsesThisCredit: usedCreditIds.has(credit.id),
    });
    if ("reason" in plan) continue;
    draws.push({ id: credit.id, pence: plan.pence });
    allocatedPence += plan.pence;
  }
  return draws;
}

export interface CandidateBill extends BillState {
  id: string;
}

/**
 * One credit spread over bills that already exist: the oldest bill first,
 * until the credit runs out. Ineligible, settled and covered bills are skipped.
 */
export function planOpenBillSweep(credit: CreditState, bills: CandidateBill[]): PlannedDraw[] {
  const draws: PlannedDraw[] = [];
  let allocatedPence = credit.allocatedPence;
  const oldestFirst = [...bills].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  for (const bill of oldestFirst) {
    if (allocatedPence >= credit.amountPence) break;
    const plan = planBillAllocation({ ...credit, allocatedPence }, bill);
    if ("reason" in plan) continue;
    draws.push({ id: bill.id, pence: plan.pence });
    allocatedPence += plan.pence;
  }
  return draws;
}

/** Cash out everything left on a credit into one unsettled month. */
export function planPayout(
  credit: Omit<CreditState, "closed">,
  month: string,
  monthSettled: boolean,
): AllocationPlan {
  if (!credit.holderInHousehold) {
    return { ok: false, reason: "The person holding this credit is not in the household" };
  }
  if (month < credit.receivedOn.slice(0, 7)) {
    return { ok: false, reason: "Cash out into the month the refund arrived or later" };
  }
  if (monthSettled) return { ok: false, reason: `Unsettle ${month} first` };
  const remaining = credit.amountPence - credit.allocatedPence;
  if (remaining <= 0) return { ok: false, reason: "Nothing is left on this credit" };
  return { ok: true, pence: remaining };
}

export interface BillAllocation {
  id: string;
  creditReceivedOn: string;
  pence: number;
}

export interface BillSnapshot {
  pence: number;
  date: string;
  month: string;
  split: string;
  categoryId: string;
  inHouseholdBills: boolean;
}

export type AllocationChange =
  | { kind: "move"; id: string; month: string }
  | { kind: "shrink"; id: string; pence: number; month: string }
  | { kind: "release"; id: string };

/**
 * What an expense edit or delete does to the credit already on it.
 * `allocations` are in the order they were made; a smaller amount trims the
 * newest first. Only fields that changed are re-checked, so renaming a
 * category's group later does not strand old bills. Any change in a settled
 * month is refused, so a settled balance never moves because of credit.
 */
export function planBillChange(
  allocations: BillAllocation[],
  before: BillSnapshot,
  after: BillSnapshot | null,
  settled: { before: boolean; after: boolean },
): { ok: true; changes: AllocationChange[] } | { ok: false; reason: string } {
  if (allocations.length === 0) return { ok: true, changes: [] };

  const changes: AllocationChange[] = [];
  if (after === null) {
    changes.push(...allocations.map((allocation) => ({ kind: "release" as const, id: allocation.id })));
  } else {
    const moved = after.month !== before.month;
    const kept: BillAllocation[] = [];
    for (const allocation of allocations) {
      const ineligible = billIneligibleReason(
        { receivedOn: allocation.creditReceivedOn },
        {
          split: after.split === before.split ? "50/50" : after.split,
          inHouseholdBills: after.categoryId === before.categoryId || after.inHouseholdBills,
          date: after.date === before.date ? allocation.creditReceivedOn : after.date,
        },
      );
      if (ineligible || (moved && settled.after)) {
        changes.push({ kind: "release", id: allocation.id });
      } else {
        kept.push(allocation);
      }
    }
    let excess = sum(kept.map((allocation) => allocation.pence)) - after.pence;
    const trimmed = new Map<string, number>();
    for (const allocation of [...kept].reverse()) {
      if (excess <= 0) break;
      const cut = Math.min(excess, allocation.pence);
      trimmed.set(allocation.id, allocation.pence - cut);
      excess -= cut;
    }
    for (const allocation of kept) {
      const pence = trimmed.get(allocation.id);
      if (pence === 0) {
        changes.push({ kind: "release", id: allocation.id });
      } else if (pence !== undefined) {
        changes.push({ kind: "shrink", id: allocation.id, pence, month: after.month });
      } else if (moved) {
        changes.push({ kind: "move", id: allocation.id, month: after.month });
      }
    }
  }

  if (changes.length > 0 && settled.before) {
    return {
      ok: false,
      reason: `${before.month} is settled and this bill uses refund credit. Unsettle ${before.month} first.`,
    };
  }
  return { ok: true, changes };
}

/**
 * Calendar dates for the household. "Today" is the Europe/London civil date.
 * Month advances keep an anchor day so the 31st returns after a short month
 * instead of sticking on the 28th or skipping a month.
 */

const LONDON = "Europe/London";

export function formatLondonDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: LONDON,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function dayOf(dateStr: string): number {
  return Number(dateStr.slice(8, 10));
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** Move `months` ahead and clamp the day to `anchorDay` in the destination month. */
export function addMonthsKeepingAnchor(dateStr: string, anchorDay: number, months: number): string {
  const [yearStr, monthStr] = dateStr.split("-");
  let year = Number(yearStr);
  let month = Number(monthStr) + months;
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  while (month < 1) {
    month += 12;
    year -= 1;
  }
  const day = Math.min(Math.max(anchorDay, 1), daysInMonth(year, month));
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Recover the original day when a short month clamped it.
 * January 31 then February 28 → anchor 31.
 * If both dates are already the 28th, the original day is gone and 28 is returned.
 */
export function inferAnchor(lastGeneratedDate: string | undefined, nextDueDate: string): number {
  const nextDay = dayOf(nextDueDate);
  if (!lastGeneratedDate) return nextDay;
  const lastDay = dayOf(lastGeneratedDate);
  return lastDay > nextDay ? lastDay : nextDay;
}

export function advanceDate(dateStr: string, frequency: string, anchorDay?: number): string {
  const anchor = anchorDay ?? dayOf(dateStr);
  switch (frequency) {
    case "daily":
      return addDays(dateStr, 1);
    case "weekly":
      return addDays(dateStr, 7);
    case "biweekly":
      return addDays(dateStr, 14);
    case "quarterly":
      return addMonthsKeepingAnchor(dateStr, anchor, 3);
    case "yearly":
      return addMonthsKeepingAnchor(dateStr, anchor, 12);
    default:
      return addMonthsKeepingAnchor(dateStr, anchor, 1);
  }
}

/** Due dates from `nextDueDate` through `today`, inclusive, capped so one run cannot loop forever. */
export function planOccurrences(
  nextDueDate: string,
  anchorDay: number,
  today: string,
  endDate: string | undefined,
  cap = 24,
): string[] {
  const dates: string[] = [];
  let cursor = nextDueDate;
  while (dates.length < cap && cursor <= today && (!endDate || cursor <= endDate)) {
    dates.push(cursor);
    cursor = advanceDate(cursor, "monthly", anchorDay);
  }
  return dates;
}

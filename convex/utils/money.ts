/**
 * Pence rounding shared by writes and by the settlement email.
 * Uses the same half-up rule as computeMonthTotals (`Math.round(pounds * 100)`).
 */

export function roundToPence(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new Error("amount must be a finite number");
  }
  return Math.round(amount * 100) / 100;
}

/** Deterministic £ formatting from integer pence. Independent of the runtime locale. */
export function formatPounds(amount: number): string {
  const pence = Math.round(amount * 100);
  const negative = pence < 0;
  const abs = Math.abs(pence);
  const pounds = Math.floor(abs / 100);
  const pennies = String(abs % 100).padStart(2, "0");
  const withCommas = pounds.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}£${withCommas}.${pennies}`;
}

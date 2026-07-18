/**
 * Shared money helpers — one rounding/formatting path for the whole app.
 */

/** Round to 2 decimal places (half-up at the penny level). */
export const round2 = (n: number) => Math.round(n * 100) / 100;

/** £1,234.56 — British formatting with thousands separators. */
export const formatCurrency = (amount: number) =>
  amount.toLocaleString("en-GB", { style: "currency", currency: "GBP" });

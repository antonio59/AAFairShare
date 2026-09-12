/**
 * Shared money helpers — one rounding/formatting path for the whole app.
 */

/** £1,234.56 — British formatting with thousands separators. */
export const formatCurrency = (amount: number) =>
  amount.toLocaleString("en-GB", { style: "currency", currency: "GBP" });

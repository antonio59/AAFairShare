export type SpendTrendReason =
  | "no_spending_both"
  | "new_spending"
  | "no_spending_current"
  | "increased"
  | "decreased"
  | "unchanged"
  | "pending";

export type SpendTrend = {
  percentage: number | null;
  reason: SpendTrendReason;
};

/** Compare current vs prior month totals. Null percentage = no meaningful % baseline. */
export function computeSpendTrend(
  currentTotal: number,
  lastTotal: number,
  opts?: { priorReady?: boolean },
): SpendTrend {
  if (opts?.priorReady === false) {
    return { percentage: null, reason: "pending" };
  }

  if (currentTotal === 0 && lastTotal === 0) {
    return { percentage: 0, reason: "no_spending_both" };
  }

  if (lastTotal === 0 && currentTotal > 0) {
    return { percentage: null, reason: "new_spending" };
  }

  if (lastTotal > 0 && currentTotal === 0) {
    return { percentage: -100, reason: "no_spending_current" };
  }

  const change = ((currentTotal - lastTotal) / lastTotal) * 100;
  let reason: SpendTrendReason = "unchanged";
  if (change > 0) reason = "increased";
  else if (change < 0) reason = "decreased";

  return { percentage: parseFloat(change.toFixed(1)), reason };
}

export type DocumentStats = {
  withDocuments: number;
  total: number;
  coverage: number;
};

export function computeDocumentStats(
  expenses: Array<{ linkedDocumentIds?: string[] | null }> | undefined,
): DocumentStats {
  if (!expenses) {
    return { withDocuments: 0, total: 0, coverage: 0 };
  }

  const total = expenses.length;
  const withDocuments = expenses.filter(
    (e) => e.linkedDocumentIds && e.linkedDocumentIds.length > 0,
  ).length;

  return {
    withDocuments,
    total,
    coverage: total > 0 ? Math.round((withDocuments / total) * 100) : 0,
  };
}

/**
 * Helpers for the expense split type.
 *
 * "custom" (legacy value "100%") means: the payer fronted 100% of the
 * expense and the other person owes them the full amount.
 */

/** Short label for tables, cards and badges. */
export function formatSplitType(splitType: string, otherName?: string): string {
  if (splitType === "custom" || splitType === "100%") {
    return otherName ? `For ${otherName}` : "For them";
  }
  return splitType;
}

/** Selector button label, e.g. "For Sarah (100%)". */
export function splitTypeSelectorLabel(otherName?: string): string {
  return otherName ? `For ${otherName} (100%)` : "100% owed by them";
}

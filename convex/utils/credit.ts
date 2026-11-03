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

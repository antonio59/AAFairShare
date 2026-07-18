/**
 * Pure settlement maths for a month's expenses.
 *
 * Split semantics:
 * - "50/50": cost is shared equally between the two users.
 * - "custom"/"100%": the payer fronted the full amount and the OTHER user
 *   owes 100% of it (e.g. you bought something entirely on their behalf).
 *
 * All arithmetic is done in integer pence to avoid floating-point drift
 * (e.g. £423.87/2 rendering as both £211.94 and £211.93 depending on the
 * accumulation path). For an odd penny in a 50/50 split, the extra penny
 * deterministically goes to user1's share.
 *
 * Extracted from monthData.ts so it can be unit-tested.
 */

export interface SettlementExpense {
  amount: number;
  paidBy: string;
  split: string;
}

export interface MonthTotals {
  totalExpenses: number;
  fairShare: number;
  settlement: number;
  settlementDirection: "owes" | "owed" | "even";
  user1Paid: number;
  user2Paid: number;
  user1Share: number;
  user2Share: number;
  sharedExpensesTotal: number;
  eachPersonsShare: number;
  user1PersonalExpenses: number;
  user2PersonalExpenses: number;
}

const toPence = (amount: number) => Math.round(amount * 100);
const toPounds = (pence: number) => pence / 100;

export function computeMonthTotals(
  expenses: SettlementExpense[],
  user1Id: string | null,
  user2Id: string | null,
): MonthTotals {
  let totalPence = 0;
  let user1PaidPence = 0;
  let user2PaidPence = 0;
  let user1SharePence = 0;
  let user2SharePence = 0;
  let sharedPence = 0;
  let user1PersonalPence = 0;
  let user2PersonalPence = 0;

  for (const expense of expenses) {
    const amountPence = toPence(expense.amount);
    totalPence += amountPence;

    if (user1Id && expense.paidBy === user1Id) {
      user1PaidPence += amountPence;
    } else if (user2Id && expense.paidBy === user2Id) {
      user2PaidPence += amountPence;
    }

    if (expense.split === "50/50") {
      // Odd penny goes to user1 deterministically so shares always sum exactly
      user1SharePence += Math.ceil(amountPence / 2);
      user2SharePence += Math.floor(amountPence / 2);
      sharedPence += amountPence;
    } else if (expense.split === "custom" || expense.split === "100%") {
      if (user1Id && expense.paidBy === user1Id) {
        // user1 fronted it — user2 owes the full amount
        user2SharePence += amountPence;
        user1PersonalPence += amountPence;
      } else if (user2Id && expense.paidBy === user2Id) {
        user1SharePence += amountPence;
        user2PersonalPence += amountPence;
      }
    }
  }

  const user1OwesPence = user1SharePence - user1PaidPence;
  let settlementDirection: MonthTotals["settlementDirection"] = "even";
  if (user1OwesPence > 0) {
    settlementDirection = "owes";
  } else if (user1OwesPence < 0) {
    settlementDirection = "owed";
  }

  return {
    totalExpenses: toPounds(totalPence),
    fairShare: toPounds(Math.round(totalPence / 2)),
    settlement: toPounds(Math.abs(user1OwesPence)),
    settlementDirection,
    user1Paid: toPounds(user1PaidPence),
    user2Paid: toPounds(user2PaidPence),
    user1Share: toPounds(user1SharePence),
    user2Share: toPounds(user2SharePence),
    sharedExpensesTotal: toPounds(sharedPence),
    eachPersonsShare: toPounds(Math.round(sharedPence / 2)),
    user1PersonalExpenses: toPounds(user1PersonalPence),
    user2PersonalExpenses: toPounds(user2PersonalPence),
  };
}

/**
 * Pure settlement maths for a month's expenses.
 *
 * Split semantics:
 * - "50/50": cost is shared equally between the two users.
 * - "custom"/"100%": the payer fronted the full amount and the OTHER user
 *   owes 100% of it (e.g. you bought something entirely on their behalf).
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

const round2 = (n: number) => parseFloat(n.toFixed(2));

export function computeMonthTotals(
  expenses: SettlementExpense[],
  user1Id: string | null,
  user2Id: string | null,
): MonthTotals {
  const totalExpenses = round2(
    expenses.reduce((sum, exp) => sum + exp.amount, 0),
  );

  let user1Paid = 0;
  let user2Paid = 0;
  let user1Share = 0;
  let user2Share = 0;
  let sharedExpensesTotal = 0;
  let user1PersonalExpenses = 0;
  let user2PersonalExpenses = 0;

  for (const expense of expenses) {
    if (user1Id && expense.paidBy === user1Id) {
      user1Paid += expense.amount;
    } else if (user2Id && expense.paidBy === user2Id) {
      user2Paid += expense.amount;
    }

    if (expense.split === "50/50") {
      user1Share += expense.amount / 2;
      user2Share += expense.amount / 2;
      sharedExpensesTotal += expense.amount;
    } else if (expense.split === "custom" || expense.split === "100%") {
      if (user1Id && expense.paidBy === user1Id) {
        // user1 fronted it — user2 owes the full amount
        user2Share += expense.amount;
        user1PersonalExpenses += expense.amount;
      } else if (user2Id && expense.paidBy === user2Id) {
        user1Share += expense.amount;
        user2PersonalExpenses += expense.amount;
      }
    }
  }

  const user1Owes = round2(user1Share - user1Paid);
  let settlementDirection: MonthTotals["settlementDirection"] = "even";
  if (user1Owes > 0) {
    settlementDirection = "owes";
  } else if (user1Owes < 0) {
    settlementDirection = "owed";
  }

  return {
    totalExpenses,
    fairShare: round2(totalExpenses / 2),
    settlement: round2(Math.abs(user1Owes)),
    settlementDirection,
    user1Paid: round2(user1Paid),
    user2Paid: round2(user2Paid),
    user1Share: round2(user1Share),
    user2Share: round2(user2Share),
    sharedExpensesTotal: round2(sharedExpensesTotal),
    eachPersonsShare: round2(sharedExpensesTotal / 2),
    user1PersonalExpenses: round2(user1PersonalExpenses),
    user2PersonalExpenses: round2(user2PersonalExpenses),
  };
}

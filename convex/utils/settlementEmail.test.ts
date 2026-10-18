import { describe, expect, it } from "bun:test";
import { computeMonthTotals } from "./settlement";
import { formatPounds } from "./money";
import {
  buildSettlementEmail,
  SETTLEMENT_PAGE_URL,
  splitLabel,
  type SettlementEmailInput,
} from "./settlementEmail";
import {
  headlineFor,
  plannedSettlement,
  settlementHasDrift,
  summariseUnsettledMonths,
} from "./settlementPlan";

const antonio = { id: "user_antonio", name: "Antonio" };
const jamie = { id: "user_jamie", name: "Jamie" };

function input(overrides: Partial<SettlementEmailInput> = {}): SettlementEmailInput {
  return {
    month: "2026-03",
    user1: antonio,
    user2: jamie,
    recipientName: "Antonio",
    recordedByName: "Jamie",
    expenses: [
      {
        date: "2026-03-02",
        description: "Groceries",
        category: "Groceries",
        paidById: antonio.id,
        paidByName: "Antonio",
        amount: 86.35,
        split: "50/50",
      },
      {
        date: "2026-03-08",
        description: "Cinema",
        category: "Entertainment",
        paidById: jamie.id,
        paidByName: "Jamie",
        amount: 24,
        split: "50/50",
      },
      {
        date: "2026-03-14",
        description: "Train ticket <script>",
        category: "Transport",
        paidById: antonio.id,
        paidByName: "Antonio",
        amount: 42.1,
        split: "custom",
      },
      {
        date: "2026-03-21",
        description: "Council tax",
        category: "Household",
        paidById: antonio.id,
        paidByName: "Antonio",
        amount: 180,
        split: "50/50",
      },
      {
        date: "2026-03-03",
        description: "Prescription",
        category: "Health",
        paidById: jamie.id,
        paidByName: "Jamie",
        amount: 12.5,
        split: "100%",
      },
    ],
    recurringBills: [
      {
        description: "Council tax",
        amount: 180,
        paidByName: "Antonio",
        date: "2026-03-21",
      },
    ],
    savingsContributions: [
      {
        goalName: "Holiday fund",
        amount: 50,
        contributorName: "Antonio",
        date: "2026-03-18",
      },
    ],
    ...overrides,
  };
}

describe("settlement email breakdown", () => {
  it("builds the headline from computeMonthTotals, including custom and legacy 100% splits", () => {
    const email = buildSettlementEmail(input());
    const totals = computeMonthTotals(
      input().expenses.map((expense) => ({
        amount: expense.amount,
        paidBy: expense.paidById,
        split: expense.split,
      })),
      antonio.id,
      jamie.id,
    );

    expect(email.totals).toEqual(totals);
    expect(email.headline).toBe(
      headlineFor(totals.settlement, totals.settlementDirection, "Antonio", "Jamie"),
    );
    expect(email.headline).not.toBe("All square");
    expect(email.subject).toBe(`March 2026 · ${email.headline}`);

    expect(email.text).toContain(`Antonio: ${formatPounds(totals.user1Paid)}`);
    expect(email.text).toContain(`Jamie: ${formatPounds(totals.user2Paid)}`);
    expect(email.html).toContain(`Total paid by Antonio`);
    expect(email.html).toContain(formatPounds(totals.user1Paid));
    expect(email.html).toContain(`Total paid by Jamie`);
    expect(email.html).toContain(formatPounds(totals.user2Paid));
    expect(email.html.indexOf("Total paid by Antonio")).toBeLessThan(
      email.html.indexOf(formatPounds(totals.user1Paid)),
    );
  });

  it("labels custom and 100% splits as paid for them and escapes expense text", () => {
    const email = buildSettlementEmail(input());
    expect(splitLabel("custom")).toBe("Paid for them");
    expect(splitLabel("100%")).toBe("Paid for them");
    expect(email.html).toContain("Paid for them");
    expect(email.text).toContain("Train ticket <script> · Antonio paid £42.10 · Paid for them");
    expect(email.text).toContain("Prescription · Jamie paid £12.50 · Paid for them");
    expect(email.html).toContain("Train ticket &lt;script&gt;");
    expect(email.html).not.toContain("<script>");
  });

  it("category totals are integer pence and add up to the settlement total", () => {
    const email = buildSettlementEmail(input());
    expect(email.text).toContain("Groceries: £86.35");
    expect(email.text).toContain("Entertainment: £24.00");
    expect(email.text).toContain("Transport: £42.10");
    expect(email.text).toContain("Household: £180.00");
    expect(email.text).toContain("Health: £12.50");

    const categoryPence = [86.35, 24, 42.1, 180, 12.5].reduce(
      (sum, amount) => sum + Math.round(amount * 100),
      0,
    );
    expect(categoryPence / 100).toBe(email.totals.totalExpenses);
  });

  it("includes recurring bills, savings, and the settlement link", () => {
    const email = buildSettlementEmail(input());
    expect(email.text).toContain("Recurring bills included");
    expect(email.text).toContain("21 Mar 2026 · Council tax · Antonio · £180.00");
    expect(email.text).toContain("Savings contributions");
    expect(email.text).toContain("Holiday fund · Antonio · £50.00");
    expect(email.text).toContain("not part of the settlement");
    expect(email.html).toContain(SETTLEMENT_PAGE_URL);
    expect(email.text).toContain(SETTLEMENT_PAGE_URL);
    expect(email.html).toContain("View settlement");
  });

  it("omits empty sections and says all square when nobody owes anything", () => {
    const email = buildSettlementEmail(
      input({
        expenses: [
          {
            date: "2026-03-01",
            description: "Coffee",
            category: "Food",
            paidById: antonio.id,
            paidByName: "Antonio",
            amount: 4.5,
            split: "50/50",
          },
          {
            date: "2026-03-02",
            description: "Coffee",
            category: "Food",
            paidById: jamie.id,
            paidByName: "Jamie",
            amount: 4.5,
            split: "50/50",
          },
        ],
        recurringBills: [],
        savingsContributions: [],
      }),
    );
    expect(email.headline).toBe("All square");
    expect(email.subject).toBe("March 2026 · All square");
    expect(email.text).not.toContain("Recurring bills included");
    expect(email.text).not.toContain("Savings contributions");
    expect(email.html).toContain("#047857");
  });

  it("shows the recorded payment when a later resend no longer matches the expenses", () => {
    const email = buildSettlementEmail(
      input({
        recorded: {
          amount: 10,
          fromUserId: jamie.id,
          fromName: "Jamie",
          toName: "Antonio",
        },
      }),
    );
    expect(email.text).toContain("Jamie was recorded as paying Antonio £10.00");
    expect(email.text).toContain(email.headline);
    expect(email.html).toContain("fffbeb");
  });
});

describe("planned settlement and open months", () => {
  it("records the server direction and ignores a client amount", () => {
    const totals = computeMonthTotals(
      [{ amount: 10.01, paidBy: antonio.id, split: "custom" }],
      antonio.id,
      jamie.id,
    );
    const planned = plannedSettlement(totals, antonio.id, jamie.id);
    expect(planned).toEqual({
      amount: 10.01,
      fromUserId: jamie.id,
      toUserId: antonio.id,
      direction: "owed",
    });
    expect(planned.amount).not.toBe(1);
  });

  it("stores an even month as £0", () => {
    const totals = computeMonthTotals([], antonio.id, jamie.id);
    expect(plannedSettlement(totals, antonio.id, jamie.id).amount).toBe(0);
  });

  it("sums unsettled months and skips settled ones", () => {
    const january = computeMonthTotals(
      [{ amount: 10, paidBy: antonio.id, split: "50/50" }],
      antonio.id,
      jamie.id,
    );
    const february = computeMonthTotals(
      [{ amount: 4, paidBy: jamie.id, split: "custom" }],
      antonio.id,
      jamie.id,
    );
    const march = computeMonthTotals(
      [{ amount: 80, paidBy: antonio.id, split: "50/50" }],
      antonio.id,
      jamie.id,
    );
    const summary = summariseUnsettledMonths([
      { month: "2026-03", totals: march, settled: true },
      { month: "2026-01", totals: january, settled: false },
      { month: "2026-02", totals: february, settled: false },
      { month: "2026-04", totals: computeMonthTotals([], antonio.id, jamie.id), settled: false },
    ]);

    expect(summary.months.map((month) => month.month)).toEqual(["2026-01", "2026-02"]);
    // January: Jamie owes Antonio £5. February: Antonio owes Jamie £4. Net Jamie owes £1.
    expect(summary.netPence).toBe(-100);
    expect(settlementHasDrift(march, { amount: 40, fromUserId: jamie.id }, antonio.id, jamie.id)).toBe(
      false,
    );
    expect(settlementHasDrift(march, { amount: 10, fromUserId: antonio.id }, antonio.id, jamie.id)).toBe(
      true,
    );
    expect(
      settlementHasDrift(
        computeMonthTotals([], antonio.id, jamie.id),
        { amount: 0, fromUserId: jamie.id },
        antonio.id,
        jamie.id,
      ),
    ).toBe(false);
  });
});

describe("formatPounds", () => {
  it("formats from integer pence", () => {
    expect(formatPounds(10.1)).toBe("£10.10");
    expect(formatPounds(1000)).toBe("£1,000.00");
    expect(formatPounds(0)).toBe("£0.00");
  });
});

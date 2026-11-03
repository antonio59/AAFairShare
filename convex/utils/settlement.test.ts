import { describe, expect, it } from "bun:test";
import { computeMonthTotals, type MonthTotals } from "./settlement";

const U1 = "user1";
const U2 = "user2";

describe("computeMonthTotals", () => {
  it("returns zeros for an empty month", () => {
    const totals = computeMonthTotals([], U1, U2);
    expect(totals.totalExpenses).toBe(0);
    expect(totals.settlement).toBe(0);
    expect(totals.settlementDirection).toBe("even");
  });

  it("splits a 50/50 expense equally", () => {
    const totals = computeMonthTotals(
      [{ amount: 100, paidBy: U1, split: "50/50" }],
      U1,
      U2,
    );
    expect(totals.user1Paid).toBe(100);
    expect(totals.user2Paid).toBe(0);
    expect(totals.sharedExpensesTotal).toBe(100);
    expect(totals.eachPersonsShare).toBe(50);
    // user1 paid £100 but their share is £50 → they are owed £50
    expect(totals.settlement).toBe(50);
    expect(totals.settlementDirection).toBe("owed");
  });

  it("is even when both users pay equal 50/50 amounts", () => {
    const totals = computeMonthTotals(
      [
        { amount: 60, paidBy: U1, split: "50/50" },
        { amount: 60, paidBy: U2, split: "50/50" },
      ],
      U1,
      U2,
    );
    expect(totals.settlement).toBe(0);
    expect(totals.settlementDirection).toBe("even");
  });

  it('"custom" means the payer fronted 100% and the other user owes it all', () => {
    const totals = computeMonthTotals(
      [{ amount: 100, paidBy: U1, split: "custom" }],
      U1,
      U2,
    );
    // user1 paid £100 on user2's behalf → user1 is owed the full £100
    expect(totals.settlement).toBe(100);
    expect(totals.settlementDirection).toBe("owed");
    expect(totals.user1PersonalExpenses).toBe(100);
    expect(totals.sharedExpensesTotal).toBe(0);
  });

  it("handles legacy \"100%\" the same as \"custom\"", () => {
    const totals = computeMonthTotals(
      [{ amount: 80, paidBy: U2, split: "100%" }],
      U1,
      U2,
    );
    // user2 fronted £80 for user1 → user1 owes £80
    expect(totals.settlement).toBe(80);
    expect(totals.settlementDirection).toBe("owes");
    expect(totals.user2PersonalExpenses).toBe(80);
  });

  it("combines shared and fronted expenses correctly", () => {
    const totals = computeMonthTotals(
      [
        { amount: 100, paidBy: U1, split: "50/50" },
        { amount: 40, paidBy: U1, split: "custom" },
        { amount: 20, paidBy: U2, split: "50/50" },
      ],
      U1,
      U2,
    );
    // user1 paid 140, their share: 50 (half of shared) + 20 (half of U2's 50/50... no—)
    // shared total = 120 → each share 60. user1 share = 60. user1 paid 140.
    // → user1 is owed 80
    expect(totals.totalExpenses).toBe(160);
    expect(totals.sharedExpensesTotal).toBe(120);
    expect(totals.settlement).toBe(80);
    expect(totals.settlementDirection).toBe("owed");
  });

  it("rounds to 2 decimal places", () => {
    const totals = computeMonthTotals(
      [{ amount: 10.005, paidBy: U1, split: "50/50" }],
      U1,
      U2,
    );
    expect(totals.settlement).toBe(5);
    expect(totals.user1Paid).toBe(10.01);
  });
});

describe("computeMonthTotals — penny consistency", () => {
  it("fair share and settlement agree on an odd-penny month (£423.87)", () => {
    const totals = computeMonthTotals(
      [{ amount: 423.87, paidBy: U2, split: "50/50" }],
      U1,
      U2,
    );
    // Both must derive from the same integer-pence path — no £211.94 vs £211.93
    expect(totals.fairShare).toBe(211.94);
    expect(totals.settlement).toBe(211.94);
    expect(totals.settlementDirection).toBe("owes");
  });

  it("shares always sum exactly to the shared total", () => {
    const amounts = [10.01, 20.03, 7.77, 0.01, 99.99];
    const totals = computeMonthTotals(
      amounts.map((amount, i) => ({
        amount,
        paidBy: i % 2 === 0 ? U1 : U2,
        split: "50/50",
      })),
      U1,
      U2,
    );
    const sum = totals.user1Share + totals.user2Share;
    expect(Math.round(sum * 100)).toBe(Math.round(totals.sharedExpensesTotal * 100));
  });
});

describe("computeMonthTotals — credit adjustments", () => {
  const mixedMonth = [
    { amount: 100, paidBy: U1, split: "50/50" },
    { amount: 40, paidBy: U1, split: "custom" },
    { amount: 25.01, paidBy: U2, split: "50/50" },
    { amount: 12, paidBy: U2, split: "100%" },
  ];

  it("leaves the output unchanged when there are no adjustments", () => {
    const expected: MonthTotals = {
      totalExpenses: 177.01,
      fairShare: 88.51,
      settlement: 65.49,
      settlementDirection: "owed",
      user1Paid: 140,
      user2Paid: 37.01,
      user1Share: 74.51,
      user2Share: 102.5,
      sharedExpensesTotal: 125.01,
      eachPersonsShare: 62.51,
      user1PersonalExpenses: 40,
      user2PersonalExpenses: 12,
      creditApplied: 0,
      creditAdjustment: 0,
    };
    expect(computeMonthTotals(mixedMonth, U1, U2)).toEqual(expected);
    expect(computeMonthTotals(mixedMonth, U1, U2, [])).toEqual(expected);
  });

  it("only changes the settlement and credit fields", () => {
    const without = computeMonthTotals(mixedMonth, U1, U2);
    const withCredit = computeMonthTotals(mixedMonth, U1, U2, [
      { holderId: U1, pence: 1000 },
    ]);
    expect({
      ...withCredit,
      settlement: without.settlement,
      settlementDirection: without.settlementDirection,
      creditApplied: 0,
      creditAdjustment: 0,
    }).toEqual(without);
  });

  describe("worked example: £240 held by user1, drawn over Nov, Dec, Jan", () => {
    it("Nov: user1 paid £90 energy, user2 paid £60 groceries → user1 owes £30", () => {
      const totals = computeMonthTotals(
        [
          { amount: 90, paidBy: U1, split: "50/50" },
          { amount: 60, paidBy: U2, split: "50/50" },
        ],
        U1,
        U2,
        [{ holderId: U1, pence: 9000, allocatedBeforePence: 0 }],
      );
      expect(totals.creditApplied).toBe(90);
      expect(totals.creditAdjustment).toBe(45);
      expect(totals.settlement).toBe(30);
      expect(totals.settlementDirection).toBe("owes");
    });

    it("Dec: user2 paid £100 energy → user1 owes £100", () => {
      const totals = computeMonthTotals(
        [{ amount: 100, paidBy: U2, split: "50/50" }],
        U1,
        U2,
        [{ holderId: U1, pence: 10000, allocatedBeforePence: 9000 }],
      );
      expect(totals.creditApplied).toBe(100);
      expect(totals.creditAdjustment).toBe(50);
      expect(totals.settlement).toBe(100);
      expect(totals.settlementDirection).toBe("owes");
    });

    it("Jan: user1 paid £90 energy, £50 credit left → user2 owes user1 £20", () => {
      const totals = computeMonthTotals(
        [{ amount: 90, paidBy: U1, split: "50/50" }],
        U1,
        U2,
        [{ holderId: U1, pence: 5000, allocatedBeforePence: 19000 }],
      );
      expect(totals.creditApplied).toBe(50);
      expect(totals.creditAdjustment).toBe(25);
      expect(totals.settlement).toBe(20);
      expect(totals.settlementDirection).toBe("owed");
    });
  });

  it("holder paid the bill: the other user owes A/2 less", () => {
    const totals = computeMonthTotals(
      [{ amount: 90, paidBy: U1, split: "50/50" }],
      U1,
      U2,
      [{ holderId: U1, pence: 9000 }],
    );
    expect(totals.settlement).toBe(0);
    expect(totals.settlementDirection).toBe("even");
  });

  it("the other user paid the bill: the holder owes B/2 + A/2", () => {
    const totals = computeMonthTotals(
      [{ amount: 90, paidBy: U1, split: "50/50" }],
      U1,
      U2,
      [{ holderId: U2, pence: 6000 }],
    );
    // user2 would owe £45; the £30 adjustment is added to what user2 owes
    expect(totals.creditAdjustment).toBe(-30);
    expect(totals.settlement).toBe(75);
    expect(totals.settlementDirection).toBe("owed");
  });

  it("adds up to exactly half(R) for an odd total (£240.01)", () => {
    const allocations = [
      { pence: 8001, allocatedBeforePence: 0 },
      { pence: 8001, allocatedBeforePence: 8001 },
      { pence: 7999, allocatedBeforePence: 16002 },
    ];
    const adjustments = allocations.map(
      (allocation) =>
        computeMonthTotals([], U1, U2, [{ holderId: U1, ...allocation }])
          .creditAdjustment,
    );
    expect(adjustments).toEqual([40, 40.01, 39.99]);
    const totalPence = adjustments.reduce(
      (total, pounds) => total + Math.round(pounds * 100),
      0,
    );
    expect(totalPence).toBe(12000);
  });

  it("ignores credits held by someone outside the household", () => {
    const totals = computeMonthTotals(
      [{ amount: 90, paidBy: U1, split: "50/50" }],
      U1,
      U2,
      [{ holderId: "someone-else", pence: 9000 }],
    );
    expect(totals.creditApplied).toBe(0);
    expect(totals.creditAdjustment).toBe(0);
    expect(totals.settlement).toBe(45);
  });
});

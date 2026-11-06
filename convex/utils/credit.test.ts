import { describe, expect, it } from "bun:test";
import {
  adjustmentForAllocation,
  adjustmentPenceFor,
  creditBalance,
  halfPence,
  planBillAllocation,
  planBillChange,
  planPayout,
  type BillSnapshot,
  type BillState,
  type CreditState,
  type StoredAllocation,
} from "./credit";
import { computeMonthTotals } from "./settlement";

const adjustmentsFor = (allocations: number[]) => {
  let before = 0;
  return allocations.map((pence) => {
    const adjustment = adjustmentPenceFor(pence, before);
    before += pence;
    return adjustment;
  });
};

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

describe("halfPence", () => {
  it("rounds an odd penny down", () => {
    expect(halfPence(24000)).toBe(12000);
    expect(halfPence(24001)).toBe(12000);
    expect(halfPence(1)).toBe(0);
  });
});

describe("adjustmentPenceFor", () => {
  it("halves a single allocation with nothing drawn before", () => {
    expect(adjustmentPenceFor(9000)).toBe(4500);
  });

  it("matches the worked example (£90, £100, £50 from £240)", () => {
    expect(adjustmentsFor([9000, 10000, 5000])).toEqual([4500, 5000, 2500]);
  });

  it("totals exactly half(R) for £240.01 split into odd allocations", () => {
    const adjustments = adjustmentsFor([8001, 8001, 7999]);
    expect(adjustments).toEqual([4000, 4001, 3999]);
    expect(sum(adjustments)).toBe(halfPence(24001));
  });

  it("never leaks a penny across many one-penny allocations", () => {
    const allocations = Array.from({ length: 24001 }, () => 1);
    expect(sum(adjustmentsFor(allocations))).toBe(halfPence(24001));
  });
});

const credit = (overrides: Partial<CreditState> = {}): CreditState => ({
  amountPence: 24000,
  receivedOn: "2026-10-15",
  closed: false,
  allocatedPence: 0,
  holderInHousehold: true,
  ...overrides,
});

const bill = (overrides: Partial<BillState> = {}): BillState => ({
  pence: 9000,
  date: "2026-11-03",
  month: "2026-11",
  split: "50/50",
  inHouseholdBills: true,
  allocatedPence: 0,
  alreadyUsesThisCredit: false,
  monthSettled: false,
  ...overrides,
});

const draw = (stored: StoredAllocation[], pence: number) => {
  const allocation = { pence, adjustmentPence: adjustmentForAllocation(stored, pence) };
  stored.push(allocation);
  return allocation;
};

describe("adjustmentForAllocation", () => {
  it("matches the cumulative rule when nothing is released", () => {
    const stored: StoredAllocation[] = [];
    expect([9000, 10000, 5000].map((pence) => draw(stored, pence).adjustmentPence)).toEqual([
      4500, 5000, 2500,
    ]);
    const odd: StoredAllocation[] = [];
    expect([8001, 8001, 7999].map((pence) => draw(odd, pence).adjustmentPence)).toEqual([
      4000, 4001, 3999,
    ]);
  });

  it("leaves earlier adjustments alone when one is released, and the next draw corrects", () => {
    const stored: StoredAllocation[] = [];
    draw(stored, 9001);
    const settled = draw(stored, 10001);
    expect(settled.adjustmentPence).toBe(5001);
    stored.splice(0, 1);
    expect(settled.adjustmentPence).toBe(5001);
    draw(stored, 24001 - 10001);
    expect(sum(stored.map((allocation) => allocation.adjustmentPence))).toBe(halfPence(24001));
  });

  it("always totals half(R) once a credit is fully drawn, whatever was released on the way", () => {
    let seed = 7;
    const random = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    for (let round = 0; round < 200; round++) {
      const amount = 1 + Math.floor(random() * 50000);
      const stored: StoredAllocation[] = [];
      for (let step = 0; step < 12; step++) {
        const drawn = sum(stored.map((allocation) => allocation.pence));
        if (stored.length > 0 && random() < 0.3) {
          stored.splice(Math.floor(random() * stored.length), 1);
          continue;
        }
        const remaining = amount - drawn;
        if (remaining <= 0) break;
        draw(stored, 1 + Math.floor(random() * remaining));
        expect(sum(stored.map((allocation) => allocation.adjustmentPence))).toBe(
          halfPence(sum(stored.map((allocation) => allocation.pence))),
        );
      }
      const drawn = sum(stored.map((allocation) => allocation.pence));
      if (drawn < amount) draw(stored, amount - drawn);
      expect(sum(stored.map((allocation) => allocation.adjustmentPence))).toBe(halfPence(amount));
      expect(creditBalance(amount, stored)).toEqual({
        allocatedPence: amount,
        remainingPence: 0,
        othersShareRemainingPence: 0,
      });
    }
  });
});

describe("creditBalance", () => {
  it("reports what is left and the other person's share of it", () => {
    expect(creditBalance(24000, [{ pence: 9000, adjustmentPence: 4500 }])).toEqual({
      allocatedPence: 9000,
      remainingPence: 15000,
      othersShareRemainingPence: 7500,
    });
  });
});

describe("planBillAllocation", () => {
  it("draws as much as both the credit and the bill allow", () => {
    expect(planBillAllocation(credit(), bill())).toEqual({ ok: true, pence: 9000 });
    expect(planBillAllocation(credit({ allocatedPence: 19000 }), bill())).toEqual({
      ok: true,
      pence: 5000,
    });
    expect(planBillAllocation(credit(), bill({ allocatedPence: 6000 }))).toEqual({
      ok: true,
      pence: 3000,
    });
  });

  it("accepts a smaller requested amount and refuses an overdraw", () => {
    expect(planBillAllocation(credit(), bill(), 2500)).toEqual({ ok: true, pence: 2500 });
    expect(planBillAllocation(credit({ allocatedPence: 23000 }), bill(), 1001)).toEqual({
      ok: false,
      reason: "Only £10.00 of this credit can go on this bill",
    });
    expect(planBillAllocation(credit(), bill(), 9001).ok).toBe(false);
    expect(planBillAllocation(credit(), bill(), 0).ok).toBe(false);
    expect(planBillAllocation(credit(), bill(), 10.5).ok).toBe(false);
  });

  it.each([
    ["a closed credit", credit({ closed: true }), bill(), "This credit is closed"],
    [
      "a holder outside the household",
      credit({ holderInHousehold: false }),
      bill(),
      "The person holding this credit is not in the household",
    ],
    ["a custom split", credit(), bill({ split: "custom" }), "Only 50/50 expenses can use a refund credit"],
    ["a legacy 100% split", credit(), bill({ split: "100%" }), "Only 50/50 expenses can use a refund credit"],
    [
      "a category that is not a household bill",
      credit(),
      bill({ inHouseholdBills: false }),
      "Only expenses in a household-bill category can use a refund credit",
    ],
    [
      "a bill before the refund arrived",
      credit(),
      bill({ date: "2026-10-14", month: "2026-10" }),
      "Only bills dated on or after 2026-10-15 can use this credit",
    ],
    ["a settled month", credit(), bill({ monthSettled: true }), "Unsettle 2026-11 first"],
    ["a second draw from the same credit", credit(), bill({ alreadyUsesThisCredit: true }), "This bill already uses this credit"],
    ["a used-up credit", credit({ allocatedPence: 24000 }), bill(), "Nothing is left on this credit"],
    ["a fully covered bill", credit(), bill({ allocatedPence: 9000 }), "This bill is already fully covered by credit"],
  ])("refuses %s", (_, creditState, billState, reason) => {
    expect(planBillAllocation(creditState, billState)).toEqual({ ok: false, reason });
  });

  it("allows a bill dated on the day the refund arrived", () => {
    expect(planBillAllocation(credit(), bill({ date: "2026-10-15", month: "2026-10" })).ok).toBe(true);
  });
});

describe("planPayout", () => {
  const state = { amountPence: 24000, receivedOn: "2026-10-15", allocatedPence: 19000, holderInHousehold: true };

  it("cashes out the whole remainder into an unsettled month", () => {
    expect(planPayout(state, "2027-01", false)).toEqual({ ok: true, pence: 5000 });
    expect(planPayout(state, "2026-10", false)).toEqual({ ok: true, pence: 5000 });
  });

  it("refuses a settled month, a month before the refund, or an empty credit", () => {
    expect(planPayout(state, "2027-01", true)).toEqual({ ok: false, reason: "Unsettle 2027-01 first" });
    expect(planPayout(state, "2026-09", false).ok).toBe(false);
    expect(planPayout({ ...state, allocatedPence: 24000 }, "2027-01", false)).toEqual({
      ok: false,
      reason: "Nothing is left on this credit",
    });
    expect(planPayout({ ...state, holderInHousehold: false }, "2027-01", false).ok).toBe(false);
  });

  it("gives the other person exactly half of what was left", () => {
    const stored: StoredAllocation[] = [];
    draw(stored, 9001);
    draw(stored, 10000);
    const payout = draw(stored, 24001 - 19001);
    const totals = computeMonthTotals([], "a", "b", [{ holderId: "a", pence: payout.pence, adjustmentPence: payout.adjustmentPence }]);
    expect(totals.creditApplied).toBe(50);
    expect(Math.round(totals.creditAdjustment * 100) + 4500 + 5000).toBe(halfPence(24001));
  });
});

describe("planBillChange", () => {
  const before: BillSnapshot = {
    pence: 9000,
    date: "2026-11-03",
    month: "2026-11",
    split: "50/50",
    categoryId: "energy",
    inHouseholdBills: true,
  };
  const one = [{ id: "a1", creditReceivedOn: "2026-10-15", pence: 9000 }];
  const two = [
    { id: "a1", creditReceivedOn: "2026-10-15", pence: 5000 },
    { id: "a2", creditReceivedOn: "2026-10-01", pence: 3000 },
  ];
  const open = { before: false, after: false };

  it("does nothing for an expense without credit, even in a settled month", () => {
    expect(planBillChange([], before, null, { before: true, after: true })).toEqual({ ok: true, changes: [] });
  });

  it("keeps credit through edits that do not affect it", () => {
    expect(planBillChange(one, before, { ...before, pence: 12000 }, open)).toEqual({ ok: true, changes: [] });
    expect(planBillChange(one, before, { ...before, date: "2026-11-20" }, open)).toEqual({ ok: true, changes: [] });
  });

  it("allows harmless edits in a settled month", () => {
    expect(planBillChange(one, before, { ...before }, { before: true, after: true })).toEqual({ ok: true, changes: [] });
    expect(planBillChange(one, before, { ...before, pence: 12000 }, { before: true, after: true }).ok).toBe(true);
  });

  it("does not strand an old bill whose category later stopped being a household bill", () => {
    const stale = { ...before, inHouseholdBills: false };
    expect(planBillChange(one, stale, { ...stale }, { before: true, after: true })).toEqual({ ok: true, changes: [] });
  });

  it("releases credit on delete in an unsettled month and refuses it in a settled one", () => {
    expect(planBillChange(two, before, null, open)).toEqual({
      ok: true,
      changes: [
        { kind: "release", id: "a1" },
        { kind: "release", id: "a2" },
      ],
    });
    expect(planBillChange(two, before, null, { before: true, after: false })).toEqual({
      ok: false,
      reason: "2026-11 is settled and this bill uses refund credit. Unsettle 2026-11 first.",
    });
  });

  it("trims the newest draw first when the amount drops", () => {
    expect(planBillChange(two, before, { ...before, pence: 6000 }, open)).toEqual({
      ok: true,
      changes: [{ kind: "shrink", id: "a2", pence: 1000, month: "2026-11" }],
    });
    expect(planBillChange(two, before, { ...before, pence: 4000 }, open)).toEqual({
      ok: true,
      changes: [
        { kind: "shrink", id: "a1", pence: 4000, month: "2026-11" },
        { kind: "release", id: "a2" },
      ],
    });
    expect(planBillChange(two, before, { ...before, pence: 4000 }, { before: true, after: true }).ok).toBe(false);
  });

  it("releases credit when the split, category, or date makes the bill ineligible", () => {
    expect(planBillChange(one, before, { ...before, split: "custom" }, open)).toEqual({
      ok: true,
      changes: [{ kind: "release", id: "a1" }],
    });
    expect(
      planBillChange(one, before, { ...before, categoryId: "groceries", inHouseholdBills: false }, open),
    ).toEqual({ ok: true, changes: [{ kind: "release", id: "a1" }] });
    expect(
      planBillChange(one, before, { ...before, categoryId: "water", inHouseholdBills: true }, open),
    ).toEqual({ ok: true, changes: [] });
    expect(
      planBillChange(two, before, { ...before, date: "2026-10-10", month: "2026-10" }, open),
    ).toEqual({
      ok: true,
      changes: [
        { kind: "release", id: "a1" },
        { kind: "move", id: "a2", month: "2026-10" },
      ],
    });
  });

  it("moves credit with the bill, but releases it rather than enter a settled month", () => {
    const moved = { ...before, date: "2026-12-01", month: "2026-12" };
    expect(planBillChange(one, before, moved, open)).toEqual({
      ok: true,
      changes: [{ kind: "move", id: "a1", month: "2026-12" }],
    });
    expect(planBillChange(one, before, moved, { before: false, after: true })).toEqual({
      ok: true,
      changes: [{ kind: "release", id: "a1" }],
    });
    expect(planBillChange(one, before, moved, { before: true, after: false }).ok).toBe(false);
  });
});

describe("credit in settlement totals, with stored adjustments", () => {
  it("is right whichever person holds the credit and whoever paid", () => {
    const energyByHolder = { amount: 90, paidBy: "a", split: "50/50" };
    const energyByOther = { amount: 90, paidBy: "b", split: "50/50" };
    const heldByA = [{ holderId: "a", pence: 9000, adjustmentPence: 4500 }];
    const heldByB = [{ holderId: "b", pence: 9000, adjustmentPence: 4500 }];

    expect(computeMonthTotals([energyByHolder], "a", "b", heldByA).settlementDirection).toBe("even");
    const aOwes = computeMonthTotals([energyByOther], "a", "b", heldByA);
    expect([aOwes.settlement, aOwes.settlementDirection]).toEqual([90, "owes"]);

    expect(computeMonthTotals([energyByOther], "a", "b", heldByB).settlementDirection).toBe("even");
    const bOwes = computeMonthTotals([energyByHolder], "a", "b", heldByB);
    expect([bOwes.settlement, bOwes.settlementDirection]).toEqual([90, "owed"]);
  });

  it("does not change a settled month when a later draw on the same credit is released", () => {
    const stored: StoredAllocation[] = [];
    const settled = draw(stored, 9001);
    const later = draw(stored, 10001);
    const settledTotals = () =>
      computeMonthTotals([{ amount: 90.01, paidBy: "a", split: "50/50" }], "a", "b", [
        { holderId: "a", pence: settled.pence, adjustmentPence: settled.adjustmentPence },
      ]);
    const beforeRelease = settledTotals();
    stored.splice(stored.indexOf(later), 1);
    expect(settledTotals()).toEqual(beforeRelease);
  });
});

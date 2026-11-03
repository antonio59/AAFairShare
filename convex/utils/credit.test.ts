import { describe, expect, it } from "bun:test";
import { adjustmentPenceFor, halfPence } from "./credit";

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

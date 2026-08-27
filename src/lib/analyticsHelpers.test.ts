import { describe, expect, it } from "bun:test";
import { computeDocumentStats, computeSpendTrend } from "./analyticsHelpers";

describe("computeSpendTrend", () => {
  it("returns pending when prior month is not ready", () => {
    expect(computeSpendTrend(100, 0, { priorReady: false })).toEqual({
      percentage: null,
      reason: "pending",
    });
    expect(computeSpendTrend(100, 50, { priorReady: false }).reason).toBe("pending");
  });

  it("treats empty prior month as new spending without a fake +100%", () => {
    expect(computeSpendTrend(190.5, 0)).toEqual({
      percentage: null,
      reason: "new_spending",
    });
  });

  it("computes percentage when both months have spend", () => {
    expect(computeSpendTrend(150, 100)).toEqual({
      percentage: 50,
      reason: "increased",
    });
    expect(computeSpendTrend(50, 100)).toEqual({
      percentage: -50,
      reason: "decreased",
    });
    expect(computeSpendTrend(100, 100)).toEqual({
      percentage: 0,
      reason: "unchanged",
    });
  });

  it("handles zero current with prior spend", () => {
    expect(computeSpendTrend(0, 80)).toEqual({
      percentage: -100,
      reason: "no_spending_current",
    });
  });
});

describe("computeDocumentStats", () => {
  it("returns zeros for undefined expenses", () => {
    expect(computeDocumentStats(undefined)).toEqual({
      withDocuments: 0,
      total: 0,
      coverage: 0,
    });
  });

  it("counts linked documents correctly", () => {
    expect(
      computeDocumentStats([
        { linkedDocumentIds: ["doc-1"] },
        { linkedDocumentIds: ["doc-2"] },
        { linkedDocumentIds: [] },
        {},
      ]),
    ).toEqual({ withDocuments: 2, total: 4, coverage: 50 });
  });

  it("reports 0% coverage for an empty month without inventing expenses", () => {
    expect(computeDocumentStats([])).toEqual({
      withDocuments: 0,
      total: 0,
      coverage: 0,
    });
  });
});

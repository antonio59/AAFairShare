import { describe, expect, it } from "bun:test";
import {
  addMonthsKeepingAnchor,
  advanceDate,
  formatLondonDate,
  inferAnchor,
  planOccurrences,
} from "./calendar";

describe("London civil date", () => {
  it("uses the London date just after UTC midnight in summer", () => {
    expect(formatLondonDate(new Date("2026-07-14T23:30:00Z"))).toBe("2026-07-15");
  });

  it("stays on the same date in winter when London is still GMT", () => {
    expect(formatLondonDate(new Date("2026-01-14T23:30:00Z"))).toBe("2026-01-14");
  });
});

describe("anchor day", () => {
  it("returns to the 31st after February", () => {
    const february = addMonthsKeepingAnchor("2026-01-31", 31, 1);
    expect(february).toBe("2026-02-28");
    expect(addMonthsKeepingAnchor(february, 31, 1)).toBe("2026-03-31");
  });

  it("does not skip February the way setUTCMonth does", () => {
    expect(advanceDate("2026-01-31", "monthly", 31)).toBe("2026-02-28");
    expect(advanceDate("2026-03-31", "monthly", 31)).toBe("2026-04-30");
    expect(advanceDate("2026-04-30", "monthly", 31)).toBe("2026-05-31");
  });

  it("keeps 29 February as the yearly anchor", () => {
    const next = advanceDate("2024-02-29", "yearly", 29);
    expect(next).toBe("2025-02-28");
    expect(advanceDate(next, "yearly", 29)).toBe("2026-02-28");
    expect(advanceDate("2027-02-28", "yearly", 29)).toBe("2028-02-29");
  });

  it("recovers 31 from a clamped February and gives up once both dates are the 28th", () => {
    expect(inferAnchor("2026-01-31", "2026-02-28")).toBe(31);
    expect(inferAnchor("2026-02-28", "2026-03-28")).toBe(28);
    expect(inferAnchor(undefined, "2026-03-03")).toBe(3);
  });
});

describe("catch-up", () => {
  it("plans each missed month on its own due date and stops at the cap", () => {
    expect(planOccurrences("2026-01-31", 31, "2026-04-15", undefined)).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
    ]);
    const many = planOccurrences("2024-01-31", 31, "2030-01-01", undefined, 24);
    expect(many).toHaveLength(24);
    expect(many[0]).toBe("2024-01-31");
    expect(many[1]).toBe("2024-02-29");
    expect(many[2]).toBe("2024-03-31");
  });

  it("does not plan past the end date", () => {
    expect(planOccurrences("2026-01-31", 31, "2026-06-01", "2026-02-28")).toEqual([
      "2026-01-31",
      "2026-02-28",
    ]);
  });
});

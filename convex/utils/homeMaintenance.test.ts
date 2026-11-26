import { describe, expect, test } from "bun:test";
import {
  assertValidMaintenanceSeverity,
  assertValidMaintenanceStatus,
  assertValidVisitOutcome,
  computeDaysOpen,
  computeMaintenanceSummary,
} from "./homeMaintenance";

describe("homeMaintenance helpers", () => {
  test("validates severities, statuses, and visit outcomes", () => {
    for (const sev of ["low", "medium", "high", "urgent"]) {
      expect(() => assertValidMaintenanceSeverity(sev)).not.toThrow();
    }
    expect(() => assertValidMaintenanceSeverity("critical")).toThrow();

    for (const st of [
      "open",
      "reported",
      "scheduled",
      "in_progress",
      "resolved",
      "escalated",
    ]) {
      expect(() => assertValidMaintenanceStatus(st)).not.toThrow();
    }
    expect(() => assertValidMaintenanceStatus("closed")).toThrow();

    for (const out of [
      "fixed",
      "temporary_fix",
      "parts_ordered",
      "no_fault_found",
      "needs_followup",
      "escalated",
      "inspection_only",
    ]) {
      expect(() => assertValidVisitOutcome(out)).not.toThrow();
    }
    expect(() => assertValidVisitOutcome("unknown")).toThrow();
  });

  test("computeDaysOpen calculates elapsed days for open and resolved issues", () => {
    expect(computeDaysOpen("2026-11-01", "2026-11-15")).toBe(14);
    expect(computeDaysOpen("2026-11-10", undefined, "2026-11-26")).toBe(16);
    expect(computeDaysOpen("2026-11-20", "2026-11-10")).toBe(0);
  });

  test("computeMaintenanceSummary counts open, escalated, resolved, visits, and costs", () => {
    const summary = computeMaintenanceSummary([
      {
        status: "escalated",
        severity: "urgent",
        visits: [{ cost: 0 }, { cost: 85.5 }],
      },
      {
        status: "in_progress",
        severity: "medium",
        visits: [{ cost: 40 }],
      },
      {
        status: "resolved",
        severity: "high",
        visits: [{ cost: 120.25 }],
      },
    ]);

    expect(summary).toEqual({
      total: 3,
      openCount: 2,
      escalatedCount: 1,
      resolvedCount: 1,
      urgentOpenCount: 1,
      totalVisits: 4,
      totalVisitCost: 245.75,
    });
  });
});

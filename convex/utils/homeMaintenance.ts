export const VALID_MAINTENANCE_SEVERITIES = [
  "low",
  "medium",
  "high",
  "urgent",
] as const;
export type MaintenanceSeverity = (typeof VALID_MAINTENANCE_SEVERITIES)[number];

export const VALID_MAINTENANCE_STATUSES = [
  "open",
  "reported",
  "scheduled",
  "in_progress",
  "resolved",
  "escalated",
] as const;
export type MaintenanceStatus = (typeof VALID_MAINTENANCE_STATUSES)[number];

export const VALID_VISIT_OUTCOMES = [
  "fixed",
  "temporary_fix",
  "parts_ordered",
  "no_fault_found",
  "needs_followup",
  "escalated",
  "inspection_only",
] as const;
export type VisitOutcome = (typeof VALID_VISIT_OUTCOMES)[number];

export function assertValidMaintenanceSeverity(
  severity: string,
  context = "severity",
): asserts severity is MaintenanceSeverity {
  if (!(VALID_MAINTENANCE_SEVERITIES as readonly string[]).includes(severity)) {
    throw new Error(
      `${context} must be one of: ${VALID_MAINTENANCE_SEVERITIES.join(", ")}`,
    );
  }
}

export function assertValidMaintenanceStatus(
  status: string,
  context = "status",
): asserts status is MaintenanceStatus {
  if (!(VALID_MAINTENANCE_STATUSES as readonly string[]).includes(status)) {
    throw new Error(
      `${context} must be one of: ${VALID_MAINTENANCE_STATUSES.join(", ")}`,
    );
  }
}

export function assertValidVisitOutcome(
  outcome: string,
  context = "outcome",
): asserts outcome is VisitOutcome {
  if (!(VALID_VISIT_OUTCOMES as readonly string[]).includes(outcome)) {
    throw new Error(
      `${context} must be one of: ${VALID_VISIT_OUTCOMES.join(", ")}`,
    );
  }
}

/**
 * Computes whole days between reportedDate and resolvedDate (or today).
 * Returns 0 if dates are invalid or inverted.
 */
export function computeDaysOpen(
  reportedDate: string,
  resolvedDate?: string,
  todayIso?: string,
): number {
  const start = Date.parse(`${reportedDate}T00:00:00Z`);
  const endStr = resolvedDate || todayIso || new Date().toISOString().slice(0, 10);
  const end = Date.parse(`${endStr}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return 0;
  }
  return Math.floor((end - start) / 86_400_000);
}

export interface MaintenanceSummaryInput {
  status: string;
  severity: string;
  visits?: Array<{ cost?: number }>;
}

export interface MaintenanceSummary {
  total: number;
  openCount: number;
  escalatedCount: number;
  resolvedCount: number;
  urgentOpenCount: number;
  totalVisits: number;
  totalVisitCost: number;
}

export function computeMaintenanceSummary(
  logs: MaintenanceSummaryInput[],
): MaintenanceSummary {
  let openCount = 0;
  let escalatedCount = 0;
  let resolvedCount = 0;
  let urgentOpenCount = 0;
  let totalVisits = 0;
  let totalVisitCost = 0;

  for (const log of logs) {
    if (log.status === "resolved") {
      resolvedCount += 1;
    } else {
      openCount += 1;
      if (log.status === "escalated") escalatedCount += 1;
      if (log.severity === "urgent" || log.severity === "high") {
        urgentOpenCount += 1;
      }
    }

    for (const visit of log.visits ?? []) {
      totalVisits += 1;
      if (visit.cost && visit.cost > 0) {
        totalVisitCost += visit.cost;
      }
    }
  }

  return {
    total: logs.length,
    openCount,
    escalatedCount,
    resolvedCount,
    urgentOpenCount,
    totalVisits,
    totalVisitCost: Math.round(totalVisitCost * 100) / 100,
  };
}

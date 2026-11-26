import { Id } from "../../../convex/_generated/dataModel";
import {
  computeDaysOpen,
  type MaintenanceSeverity,
  type MaintenanceStatus,
  type VisitOutcome,
} from "../../../convex/utils/homeMaintenance";
import { escapeCsvCell } from "@/components/catalog/catalogConstants";

export interface MaintenanceVisit {
  id: string;
  date: string;
  contractor: string;
  summary: string;
  outcome: VisitOutcome | string;
  cost?: number;
  notes?: string;
}

export interface MaintenanceLinkedCatalogItem {
  _id: Id<"homeCatalogItems">;
  name: string;
  room: string;
  brand?: string;
  modelNumber?: string;
  serialNumber?: string;
}

export interface MaintenanceLinkedDocument {
  _id: Id<"documents">;
  type: string;
  title?: string;
  fileType: string;
  date: string;
  url: string | null;
}

export interface MaintenanceLinkedExpense {
  _id: Id<"expenses">;
  amount: number;
  date: string;
  description: string;
  location: string;
}

export interface MaintenanceLog {
  _id: Id<"homeMaintenanceLogs">;
  title: string;
  category: string;
  room: string;
  addressId?: Id<"addresses">;
  addressName?: string | null;
  catalogItemId?: Id<"homeCatalogItems">;
  linkedCatalogItem?: MaintenanceLinkedCatalogItem | null;
  severity: MaintenanceSeverity | string;
  status: MaintenanceStatus | string;
  reportedDate: string;
  resolvedDate?: string;
  reportedTo?: string;
  referenceNumber?: string;
  description?: string;
  resolutionSummary?: string;
  visits: MaintenanceVisit[];
  photoStorageIds?: Id<"_storage">[];
  photos: Array<{ storageId: Id<"_storage">; url: string | null }>;
  linkedDocumentIds?: Id<"documents">[];
  linkedDocuments: MaintenanceLinkedDocument[];
  linkedExpenseId?: Id<"expenses">;
  linkedExpense?: MaintenanceLinkedExpense | null;
  createdBy?: Id<"users">;
  createdByName?: string;
  createdAt: number;
  updatedAt: number;
}

export const MAINTENANCE_CATEGORIES = [
  "Heating / Boiler",
  "Plumbing",
  "Electrical",
  "Appliance Repair",
  "Damp / Mould",
  "Windows & Doors",
  "Structural / Roof",
  "Pest Control",
  "Routine Service",
  "Garden / Exterior",
  "Other",
] as const;

export const MAINTENANCE_SEVERITY_OPTIONS: Array<{
  value: MaintenanceSeverity;
  label: string;
  badgeClass: string;
}> = [
  {
    value: "low",
    label: "Low",
    badgeClass:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  {
    value: "medium",
    label: "Medium",
    badgeClass:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  },
  {
    value: "high",
    label: "High",
    badgeClass:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  },
  {
    value: "urgent",
    label: "Urgent",
    badgeClass:
      "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  },
];

export const MAINTENANCE_STATUS_OPTIONS: Array<{
  value: MaintenanceStatus;
  label: string;
  badgeClass: string;
}> = [
  {
    value: "open",
    label: "Open",
    badgeClass:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  },
  {
    value: "reported",
    label: "Reported",
    badgeClass:
      "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  },
  {
    value: "scheduled",
    label: "Visit Scheduled",
    badgeClass:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  },
  {
    value: "in_progress",
    label: "In Progress",
    badgeClass:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  },
  {
    value: "escalated",
    label: "Escalated",
    badgeClass:
      "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  },
  {
    value: "resolved",
    label: "Resolved",
    badgeClass:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
];

export const VISIT_OUTCOME_OPTIONS: Array<{
  value: VisitOutcome;
  label: string;
  badgeClass: string;
}> = [
  {
    value: "fixed",
    label: "Fixed",
    badgeClass:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  {
    value: "temporary_fix",
    label: "Temporary Fix",
    badgeClass:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  },
  {
    value: "parts_ordered",
    label: "Parts Ordered",
    badgeClass:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  },
  {
    value: "needs_followup",
    label: "Needs Follow-up",
    badgeClass:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  },
  {
    value: "inspection_only",
    label: "Inspection Only",
    badgeClass:
      "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
  },
  {
    value: "no_fault_found",
    label: "No Fault Found",
    badgeClass:
      "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  },
  {
    value: "escalated",
    label: "Escalated",
    badgeClass:
      "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  },
];

export function getMaintenanceSeverityMeta(severity: string) {
  return (
    MAINTENANCE_SEVERITY_OPTIONS.find((s) => s.value === severity) ??
    MAINTENANCE_SEVERITY_OPTIONS[1]
  );
}

export function getMaintenanceStatusMeta(status: string) {
  return (
    MAINTENANCE_STATUS_OPTIONS.find((s) => s.value === status) ??
    MAINTENANCE_STATUS_OPTIONS[0]
  );
}

export function getVisitOutcomeMeta(outcome: string) {
  return (
    VISIT_OUTCOME_OPTIONS.find((o) => o.value === outcome) ??
    VISIT_OUTCOME_OPTIONS[4]
  );
}

export function exportMaintenanceToCsv(
  logs: MaintenanceLog[],
  filename = "maintenance-report.csv",
) {
  const headers = [
    "Title",
    "Status",
    "Priority",
    "Category",
    "Room",
    "Property",
    "Linked Appliance / Item",
    "Reported Date",
    "Resolved Date",
    "Days Open",
    "Reported To",
    "Reference #",
    "Description",
    "Visits Count",
    "Visits & Outcomes",
    "Resolution Summary",
  ];

  const rows = logs.map((log) => [
    log.title,
    getMaintenanceStatusMeta(log.status).label,
    getMaintenanceSeverityMeta(log.severity).label,
    log.category,
    log.room,
    log.addressName ?? "",
    log.linkedCatalogItem?.name ?? "",
    log.reportedDate,
    log.resolvedDate ?? "",
    computeDaysOpen(log.reportedDate, log.resolvedDate),
    log.reportedTo ?? "",
    log.referenceNumber ?? "",
    log.description ?? "",
    log.visits.length,
    log.visits
      .map(
        (v) =>
          `${v.date} (${v.contractor} - ${getVisitOutcomeMeta(v.outcome).label}): ${v.summary}`,
      )
      .join(" ; "),
    log.resolutionSummary ?? "",
  ]);

  const csvContent = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

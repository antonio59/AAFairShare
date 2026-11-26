import { rgb } from "pdf-lib";
import { formatCurrency } from "@/lib/money";
import {
  computeDaysOpen,
  computeMaintenanceSummary,
} from "../../../convex/utils/homeMaintenance";
import {
  getMaintenanceSeverityMeta,
  getMaintenanceStatusMeta,
  getVisitOutcomeMeta,
  type MaintenanceLog,
} from "@/components/maintenance/maintenanceConstants";
import { PdfReportBuilder } from "./pdfHelpers";

export async function downloadMaintenanceReportPdf(
  logs: MaintenanceLog[],
  options: { propertyLabel?: string; reportTitle?: string } = {},
): Promise<void> {
  const builder = new PdfReportBuilder();
  await builder.init();

  const summary = computeMaintenanceSummary(logs);
  const today = new Date().toISOString().slice(0, 10);

  builder.drawText(
    options.reportTitle || "Property Maintenance & Escalation Report",
    {
      size: 18,
      bold: true,
      color: rgb(0.15, 0.39, 0.92),
      lineGap: 24,
    },
  );
  builder.drawText(
    `Generated: ${today}${options.propertyLabel ? `  |  Property: ${options.propertyLabel}` : "  |  All Properties"}`,
    { size: 9.5, color: rgb(0.4, 0.45, 0.52), lineGap: 16 },
  );
  builder.drawText(
    `Total Issues: ${summary.total}  |  Open: ${summary.openCount} (${summary.escalatedCount} Escalated)  |  Resolved: ${summary.resolvedCount}  |  Contractor Visits: ${summary.totalVisits}`,
    { size: 10, bold: true, lineGap: 16 },
  );
  if (summary.totalVisitCost > 0) {
    builder.drawText(
      `Total Logged Repair / Visit Spend: ${formatCurrency(summary.totalVisitCost)}`,
      { size: 9.5, color: rgb(0.25, 0.3, 0.38), lineGap: 15 },
    );
  }
  builder.drawRule(4, 12);

  // Chronological oldest-first for formal escalation / handover narrative
  const sorted = [...logs].sort((a, b) =>
    a.reportedDate.localeCompare(b.reportedDate),
  );

  for (let i = 0; i < sorted.length; i += 1) {
    const log = sorted[i];
    const statusMeta = getMaintenanceStatusMeta(log.status);
    const sevMeta = getMaintenanceSeverityMeta(log.severity);
    const days = computeDaysOpen(log.reportedDate, log.resolvedDate, today);

    builder.ensureSpace(72);
    builder.drawText(
      `${i + 1}. ${log.title}  [${statusMeta.label} | ${sevMeta.label} Priority]`,
      { size: 12, bold: true, color: rgb(0.06, 0.14, 0.25), lineGap: 16 },
    );

    const metaBits = [
      `Room: ${log.room}`,
      `Category: ${log.category}`,
      `Reported: ${log.reportedDate}`,
      log.resolvedDate
        ? `Resolved: ${log.resolvedDate} (${days}d)`
        : `Open for ${days} day${days === 1 ? "" : "s"}`,
    ];
    if (log.addressName) metaBits.push(`Property: ${log.addressName}`);
    builder.drawText(metaBits.join("  |  "), {
      size: 9,
      color: rgb(0.3, 0.35, 0.42),
      indent: 8,
      lineGap: 13,
    });

    const refBits: string[] = [];
    if (log.reportedTo) refBits.push(`Reported To: ${log.reportedTo}`);
    if (log.referenceNumber) refBits.push(`Ref #: ${log.referenceNumber}`);
    if (log.linkedCatalogItem) {
      const ci = log.linkedCatalogItem;
      const ident = [ci.brand, ci.modelNumber, ci.serialNumber]
        .filter(Boolean)
        .join(" / ");
      refBits.push(`Appliance / Item: ${ci.name}${ident ? ` (${ident})` : ""}`);
    }
    if (refBits.length > 0) {
      builder.drawText(refBits.join("  |  "), {
        size: 9,
        color: rgb(0.25, 0.3, 0.4),
        indent: 8,
        lineGap: 13,
      });
    }

    if (log.description) {
      builder.drawText(`Issue Details: ${log.description}`, {
        size: 9.5,
        indent: 8,
        lineGap: 13.5,
      });
    }

    if (log.visits.length > 0) {
      builder.y -= 2;
      builder.drawText(`Engineer Visits & Updates (${log.visits.length}):`, {
        size: 9.5,
        bold: true,
        indent: 8,
        lineGap: 14,
      });
      for (const visit of log.visits) {
        const outcomeLabel = getVisitOutcomeMeta(visit.outcome).label;
        const costText =
          visit.cost !== undefined && visit.cost > 0
            ? ` (${formatCurrency(visit.cost)})`
            : "";
        builder.drawText(
          `- ${visit.date} | ${visit.contractor} | Outcome: ${outcomeLabel}${costText}`,
          { size: 9, bold: true, indent: 16, lineGap: 13 },
        );
        builder.drawText(visit.summary, {
          size: 9,
          color: rgb(0.25, 0.3, 0.38),
          indent: 24,
          lineGap: 12.5,
        });
        if (visit.notes) {
          builder.drawText(`Follow-up: ${visit.notes}`, {
            size: 8.5,
            color: rgb(0.4, 0.45, 0.52),
            indent: 24,
            lineGap: 12,
          });
        }
      }
    }

    if (log.linkedDocuments.length > 0) {
      const docs = log.linkedDocuments
        .map((d) => `${d.title || d.type} (${d.date})`)
        .join(", ");
      builder.drawText(`Attached Evidence / Documents: ${docs}`, {
        size: 8.5,
        color: rgb(0.25, 0.32, 0.55),
        indent: 8,
        lineGap: 12.5,
      });
    }

    if (log.resolutionSummary) {
      builder.drawText(`Final Outcome / Resolution: ${log.resolutionSummary}`, {
        size: 9.5,
        bold: true,
        color: rgb(0.08, 0.42, 0.24),
        indent: 8,
        lineGap: 14,
      });
    }

    builder.drawRule(4, 12);
  }

  await builder.download(`maintenance-report-${today}.pdf`);
}

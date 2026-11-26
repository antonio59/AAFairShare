import { rgb } from "pdf-lib";
import { formatCurrency } from "@/lib/money";
import {
  computeCatalogSummary,
  formatDimensions,
} from "../../../convex/utils/homeCatalog";
import {
  getMovingStatusMeta,
  type CatalogItem,
} from "@/components/catalog/catalogConstants";
import { PdfReportBuilder } from "./pdfHelpers";

export async function downloadCatalogPdf(
  items: CatalogItem[],
  options: { propertyLabel?: string } = {},
): Promise<void> {
  const builder = new PdfReportBuilder();
  await builder.init();

  const summary = computeCatalogSummary(items);
  const today = new Date().toISOString().slice(0, 10);

  builder.drawText("AAFairShare - Home Catalog & Moving Pack", {
    size: 18,
    bold: true,
    color: rgb(0.15, 0.39, 0.92),
    lineGap: 24,
  });
  builder.drawText(
    `Generated: ${today}${options.propertyLabel ? `  |  Property: ${options.propertyLabel}` : ""}`,
    { size: 9.5, color: rgb(0.4, 0.45, 0.52), lineGap: 16 },
  );
  builder.drawText(
    `Active Items: ${summary.activeItemsCount}  |  Spaces Logged: ${summary.activeSpacesCount}  |  Total Active Insured Value: ${formatCurrency(summary.totalActiveValue)}`,
    { size: 10.5, bold: true, lineGap: 18 },
  );
  builder.drawRule(2, 12);

  // Group entries by room alphabetically
  const rooms = Array.from(new Set(items.map((i) => i.room))).sort((a, b) =>
    a.localeCompare(b),
  );

  for (const room of rooms) {
    const roomItems = items.filter((i) => i.room === room);
    const roomValue = roomItems.reduce(
      (sum, i) => sum + (i.entryType === "item" ? (i.purchasePrice ?? 0) : 0),
      0,
    );

    builder.ensureSpace(48);
    builder.drawText(
      `${room} (${roomItems.length})${roomValue > 0 ? ` - ${formatCurrency(roomValue)}` : ""}`,
      { size: 13, bold: true, color: rgb(0.06, 0.14, 0.25), lineGap: 18 },
    );

    for (const item of roomItems) {
      builder.ensureSpace(46);
      const status = getMovingStatusMeta(item.movingStatus).shortLabel;
      const priceText =
        item.purchasePrice !== undefined
          ? ` | ${formatCurrency(item.purchasePrice)}`
          : "";
      builder.drawText(
        `${item.name} [${item.entryType === "space" ? "Space" : item.category} - ${status}]${priceText}`,
        { size: 10.5, bold: true, indent: 8, lineGap: 14 },
      );

      const details: string[] = [];
      const dims = formatDimensions(item);
      if (dims) details.push(`Dimensions: ${dims}`);
      if (item.weight !== undefined) {
        details.push(`Weight: ${item.weight} ${item.weightUnit || "kg"}`);
      }
      if (item.brand) details.push(`Brand: ${item.brand}`);
      if (item.modelNumber) details.push(`Model: ${item.modelNumber}`);
      if (item.serialNumber) details.push(`Serial: ${item.serialNumber}`);
      if (item.retailer) details.push(`Retailer: ${item.retailer}`);
      if (item.purchaseDate) details.push(`Purchased: ${item.purchaseDate}`);
      if (item.warrantyExpiryDate) {
        details.push(`Warranty until: ${item.warrantyExpiryDate}`);
      }

      if (details.length > 0) {
        builder.drawText(details.join("  |  "), {
          size: 9,
          color: rgb(0.3, 0.35, 0.42),
          indent: 14,
          lineGap: 13,
        });
      }

      if (item.measurementNotes) {
        builder.drawText(`Clearance / Measurement: ${item.measurementNotes}`, {
          size: 9,
          color: rgb(0.3, 0.35, 0.42),
          indent: 14,
          lineGap: 13,
        });
      }

      if (item.linkedDocuments.length > 0) {
        const docList = item.linkedDocuments
          .map((d) => `${d.title || d.type} (${d.type})`)
          .join(", ");
        builder.drawText(`Linked Documents: ${docList}`, {
          size: 9,
          color: rgb(0.25, 0.32, 0.55),
          indent: 14,
          lineGap: 13,
        });
      }

      if (item.notes) {
        builder.drawText(`Notes: ${item.notes}`, {
          size: 9,
          color: rgb(0.35, 0.4, 0.47),
          indent: 14,
          lineGap: 13,
        });
      }

      builder.y -= 4;
    }

    builder.drawRule(2, 10);
  }

  await builder.download(`home-catalog-${today}.pdf`);
}

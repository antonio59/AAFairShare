import { describe, expect, test } from "bun:test";
import {
  assertNonNegativeNumber,
  assertOptionalPositiveNumber,
  assertValidDimensionUnit,
  assertValidEntryType,
  assertValidMovingStatus,
  assertValidWeightUnit,
  computeCatalogSummary,
  formatDimensions,
  isArchivedMovingStatus,
  resolveArchiveState,
} from "./homeCatalog";

describe("homeCatalog helpers", () => {
  describe("validation", () => {
    test("validates entry types", () => {
      expect(() => assertValidEntryType("item")).not.toThrow();
      expect(() => assertValidEntryType("space")).not.toThrow();
      expect(() => assertValidEntryType("furniture")).toThrow();
    });

    test("validates dimension and weight units", () => {
      for (const unit of ["cm", "mm", "m", "in", "ft"]) {
        expect(() => assertValidDimensionUnit(unit)).not.toThrow();
      }
      expect(() => assertValidDimensionUnit("km")).toThrow();

      expect(() => assertValidWeightUnit("kg")).not.toThrow();
      expect(() => assertValidWeightUnit("lbs")).not.toThrow();
      expect(() => assertValidWeightUnit("st")).toThrow();
    });

    test("validates moving statuses", () => {
      for (const status of [
        "keeping",
        "plan_sell",
        "plan_donate",
        "stays",
        "undecided",
        "sold",
        "donated",
        "binned",
      ]) {
        expect(() => assertValidMovingStatus(status)).not.toThrow();
      }
      expect(() => assertValidMovingStatus("lost")).toThrow();
    });

    test("validates numeric bounds", () => {
      expect(() => assertOptionalPositiveNumber(undefined, "width")).not.toThrow();
      expect(() => assertOptionalPositiveNumber(60, "width")).not.toThrow();
      expect(() => assertOptionalPositiveNumber(0, "width")).toThrow();
      expect(() => assertOptionalPositiveNumber(-5, "width")).toThrow();

      expect(() => assertNonNegativeNumber(0, "purchasePrice")).not.toThrow();
      expect(() => assertNonNegativeNumber(499.99, "purchasePrice")).not.toThrow();
      expect(() => assertNonNegativeNumber(-1, "purchasePrice")).toThrow();
    });
  });

  describe("auto-archiving rules", () => {
    test("identifies terminal statuses that auto-archive", () => {
      expect(isArchivedMovingStatus("sold")).toBe(true);
      expect(isArchivedMovingStatus("donated")).toBe(true);
      expect(isArchivedMovingStatus("binned")).toBe(true);

      expect(isArchivedMovingStatus("keeping")).toBe(false);
      expect(isArchivedMovingStatus("plan_sell")).toBe(false);
      expect(isArchivedMovingStatus("plan_donate")).toBe(false);
      expect(isArchivedMovingStatus("stays")).toBe(false);
      expect(isArchivedMovingStatus("undecided")).toBe(false);
    });

    test("resolveArchiveState archives sold/donated/binned items and preserves original timestamp", () => {
      const first = resolveArchiveState("sold", undefined, 1000);
      expect(first).toEqual({ isArchived: true, archivedAt: 1000 });

      const updated = resolveArchiveState("donated", 1000, 2000);
      expect(updated).toEqual({ isArchived: true, archivedAt: 1000 });

      const binned = resolveArchiveState("binned", undefined, 3000);
      expect(binned).toEqual({ isArchived: true, archivedAt: 3000 });
    });

    test("resolveArchiveState unarchives when moved back to an active status", () => {
      expect(resolveArchiveState("keeping", 1000, 2000)).toEqual({
        isArchived: false,
        archivedAt: undefined,
      });
      expect(resolveArchiveState("plan_sell", 1000, 2000)).toEqual({
        isArchived: false,
        archivedAt: undefined,
      });
    });
  });

  describe("formatDimensions", () => {
    test("formats full W × D × H without axis suffix", () => {
      expect(
        formatDimensions({ width: 60, depth: 55, height: 85, dimensionUnit: "cm" }),
      ).toBe("60 × 55 × 85 cm");
    });

    test("formats partial dimensions with explicit axis labels", () => {
      expect(
        formatDimensions({ width: 180, height: 120, dimensionUnit: "cm" }),
      ).toBe("180 × 120 cm (W × H)");
      expect(formatDimensions({ width: 92, dimensionUnit: "cm" })).toBe(
        "92 cm (W)",
      );
    });

    test("returns null when no dimensions are set", () => {
      expect(formatDimensions({})).toBeNull();
    });
  });

  describe("computeCatalogSummary", () => {
    test("excludes sold/donated/binned items from active counts and value totals", () => {
      const summary = computeCatalogSummary([
        {
          entryType: "item",
          purchasePrice: 549.99,
          movingStatus: "keeping",
          isArchived: false,
          width: 60,
          depth: 55,
          height: 85,
          linkedDocumentIds: ["doc-1"],
        },
        {
          entryType: "item",
          purchasePrice: 899,
          movingStatus: "plan_sell",
          isArchived: false,
          width: 210,
        },
        {
          entryType: "space",
          movingStatus: "stays",
          isArchived: false,
          width: 62,
          height: 88,
        },
        {
          entryType: "item",
          purchasePrice: 250,
          movingStatus: "sold",
          isArchived: true,
        },
        {
          entryType: "item",
          purchasePrice: 120,
          movingStatus: "donated",
          isArchived: true,
        },
        {
          entryType: "item",
          purchasePrice: 45,
          movingStatus: "binned",
        },
      ]);

      expect(summary.activeItemsCount).toBe(2);
      expect(summary.activeSpacesCount).toBe(1);
      expect(summary.archivedCount).toBe(3);
      expect(summary.totalActiveValue).toBe(1448.99);
      expect(summary.withMeasurementsCount).toBe(3);
      expect(summary.withDocumentsCount).toBe(1);
      expect(summary.byStatus.sold).toBe(1);
      expect(summary.byStatus.donated).toBe(1);
      expect(summary.byStatus.binned).toBe(1);
    });
  });
});

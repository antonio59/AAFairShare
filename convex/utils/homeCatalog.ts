export const VALID_ENTRY_TYPES = ["item", "space"] as const;
export type CatalogEntryType = (typeof VALID_ENTRY_TYPES)[number];

export const VALID_DIMENSION_UNITS = ["cm", "mm", "m", "in", "ft"] as const;
export type DimensionUnit = (typeof VALID_DIMENSION_UNITS)[number];

export const VALID_WEIGHT_UNITS = ["kg", "lbs"] as const;
export type WeightUnit = (typeof VALID_WEIGHT_UNITS)[number];

export const ACTIVE_MOVING_STATUSES = [
  "keeping",
  "plan_sell",
  "plan_donate",
  "stays",
  "undecided",
] as const;

export const ARCHIVED_MOVING_STATUSES = [
  "sold",
  "donated",
  "binned",
] as const;

export const VALID_MOVING_STATUSES = [
  ...ACTIVE_MOVING_STATUSES,
  ...ARCHIVED_MOVING_STATUSES,
] as const;

export type ActiveMovingStatus = (typeof ACTIVE_MOVING_STATUSES)[number];
export type ArchivedMovingStatus = (typeof ARCHIVED_MOVING_STATUSES)[number];
export type MovingStatus = (typeof VALID_MOVING_STATUSES)[number];

export function isArchivedMovingStatus(
  status: string,
): status is ArchivedMovingStatus {
  return (ARCHIVED_MOVING_STATUSES as readonly string[]).includes(status);
}

export function assertValidEntryType(
  entryType: string,
  context = "entryType",
): asserts entryType is CatalogEntryType {
  if (!(VALID_ENTRY_TYPES as readonly string[]).includes(entryType)) {
    throw new Error(
      `${context} must be one of: ${VALID_ENTRY_TYPES.join(", ")}`,
    );
  }
}

export function assertValidDimensionUnit(
  unit: string,
  context = "dimensionUnit",
): asserts unit is DimensionUnit {
  if (!(VALID_DIMENSION_UNITS as readonly string[]).includes(unit)) {
    throw new Error(
      `${context} must be one of: ${VALID_DIMENSION_UNITS.join(", ")}`,
    );
  }
}

export function assertValidWeightUnit(
  unit: string,
  context = "weightUnit",
): asserts unit is WeightUnit {
  if (!(VALID_WEIGHT_UNITS as readonly string[]).includes(unit)) {
    throw new Error(
      `${context} must be one of: ${VALID_WEIGHT_UNITS.join(", ")}`,
    );
  }
}

export function assertValidMovingStatus(
  status: string,
  context = "movingStatus",
): asserts status is MovingStatus {
  if (!(VALID_MOVING_STATUSES as readonly string[]).includes(status)) {
    throw new Error(
      `${context} must be one of: ${VALID_MOVING_STATUSES.join(", ")}`,
    );
  }
}

export function assertNonNegativeNumber(value: number, context: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${context} must be a non-negative number`);
  }
}

export function assertOptionalPositiveNumber(
  value: number | undefined,
  context: string,
) {
  if (value !== undefined && (!Number.isFinite(value) || value <= 0)) {
    throw new Error(`${context} must be a positive number`);
  }
}

/**
 * Derives archive fields from a catalog item's movingStatus.
 * Tagging an item as sold, donated, or binned automatically archives it;
 * switching back to an active status restores it.
 */
export function resolveArchiveState(
  movingStatus: MovingStatus,
  existingArchivedAt?: number,
  now = Date.now(),
): { isArchived: boolean; archivedAt: number | undefined } {
  if (isArchivedMovingStatus(movingStatus)) {
    return {
      isArchived: true,
      archivedAt: existingArchivedAt ?? now,
    };
  }
  return {
    isArchived: false,
    archivedAt: undefined,
  };
}

export interface DimensionsInput {
  width?: number;
  depth?: number;
  height?: number;
  dimensionUnit?: string;
}

/**
 * Formats available dimensions into a concise label, e.g. "60 × 55 × 85 cm"
 * or "180 × 120 cm (W × H)" when only a subset is recorded.
 */
export function formatDimensions({
  width,
  depth,
  height,
  dimensionUnit = "cm",
}: DimensionsInput): string | null {
  const parts: Array<{ axis: string; value: number }> = [];
  if (width !== undefined && Number.isFinite(width)) {
    parts.push({ axis: "W", value: width });
  }
  if (depth !== undefined && Number.isFinite(depth)) {
    parts.push({ axis: "D", value: depth });
  }
  if (height !== undefined && Number.isFinite(height)) {
    parts.push({ axis: "H", value: height });
  }
  if (parts.length === 0) return null;

  const values = parts.map((p) => p.value).join(" × ");
  const axes = parts.map((p) => p.axis).join(" × ");
  if (parts.length === 3) {
    return `${values} ${dimensionUnit}`;
  }
  return `${values} ${dimensionUnit} (${axes})`;
}

export interface CatalogSummaryItem {
  entryType: string;
  purchasePrice?: number;
  isArchived?: boolean;
  movingStatus: string;
  linkedDocumentIds?: string[];
  width?: number;
  depth?: number;
  height?: number;
}

export interface CatalogSummary {
  activeItemsCount: number;
  activeSpacesCount: number;
  archivedCount: number;
  totalActiveValue: number;
  withMeasurementsCount: number;
  withDocumentsCount: number;
  byStatus: Record<string, number>;
}

/**
 * Computes household summary metrics. Archived items (sold/donated/binned) are
 * excluded from active counts and active insured/purchase value totals.
 */
export function computeCatalogSummary(
  items: CatalogSummaryItem[],
): CatalogSummary {
  let activeItemsCount = 0;
  let activeSpacesCount = 0;
  let archivedCount = 0;
  let totalActiveValue = 0;
  let withMeasurementsCount = 0;
  let withDocumentsCount = 0;
  const byStatus: Record<string, number> = {};

  for (const item of items) {
    const archived = Boolean(
      item.isArchived || isArchivedMovingStatus(item.movingStatus),
    );
    byStatus[item.movingStatus] = (byStatus[item.movingStatus] ?? 0) + 1;

    if (archived) {
      archivedCount += 1;
      continue;
    }

    if (item.entryType === "space") {
      activeSpacesCount += 1;
    } else {
      activeItemsCount += 1;
      if (item.purchasePrice && item.purchasePrice > 0) {
        totalActiveValue += item.purchasePrice;
      }
    }

    if (
      item.width !== undefined ||
      item.depth !== undefined ||
      item.height !== undefined
    ) {
      withMeasurementsCount += 1;
    }

    if (item.linkedDocumentIds && item.linkedDocumentIds.length > 0) {
      withDocumentsCount += 1;
    }
  }

  return {
    activeItemsCount,
    activeSpacesCount,
    archivedCount,
    totalActiveValue: Math.round(totalActiveValue * 100) / 100,
    withMeasurementsCount,
    withDocumentsCount,
    byStatus,
  };
}

const UNIT_TO_MM: Record<DimensionUnit, number> = {
  mm: 1,
  cm: 10,
  m: 1000,
  in: 25.4,
  ft: 304.8,
};

export function toMillimetres(
  value: number,
  unit: string | undefined = "cm",
): number {
  const factor = UNIT_TO_MM[(unit as DimensionUnit) ?? "cm"] ?? 10;
  return value * factor;
}

export function fromMillimetres(
  mm: number,
  unit: string | undefined = "cm",
): number {
  const factor = UNIT_TO_MM[(unit as DimensionUnit) ?? "cm"] ?? 10;
  return Math.round((mm / factor) * 10) / 10;
}

export interface AxisFitResult {
  axis: "width" | "depth" | "height";
  label: "Width" | "Depth" | "Height";
  itemValue: number | null;
  spaceValue: number | null;
  clearance: number | null; // in space's unit; >= 0 fits, < 0 too tight
  fits: boolean | null; // null if either side is unmeasured
}

export interface FitCheckResult {
  unit: string;
  overallFits: boolean | null;
  comparableAxes: number;
  axes: AxisFitResult[];
}

/**
 * Compares an item's dimensions against a logged space's dimensions,
 * normalizing across metric/imperial units and reporting clearance per axis
 * in the space's unit.
 */
export function checkItemFitsSpace(
  item: DimensionsInput,
  space: DimensionsInput,
): FitCheckResult {
  const unit = space.dimensionUnit || item.dimensionUnit || "cm";
  const defs: Array<{ axis: "width" | "depth" | "height"; label: "Width" | "Depth" | "Height" }> = [
    { axis: "width", label: "Width" },
    { axis: "depth", label: "Depth" },
    { axis: "height", label: "Height" },
  ];

  let comparableAxes = 0;
  let allFit = true;

  const axes: AxisFitResult[] = defs.map(({ axis, label }) => {
    const rawItem = item[axis];
    const rawSpace = space[axis];
    const itemMm =
      rawItem !== undefined && Number.isFinite(rawItem)
        ? toMillimetres(rawItem, item.dimensionUnit)
        : null;
    const spaceMm =
      rawSpace !== undefined && Number.isFinite(rawSpace)
        ? toMillimetres(rawSpace, space.dimensionUnit)
        : null;

    if (itemMm === null || spaceMm === null) {
      return {
        axis,
        label,
        itemValue: itemMm !== null ? fromMillimetres(itemMm, unit) : null,
        spaceValue: spaceMm !== null ? fromMillimetres(spaceMm, unit) : null,
        clearance: null,
        fits: null,
      };
    }

    comparableAxes += 1;
    const diffMm = spaceMm - itemMm;
    const fits = diffMm >= -0.01;
    if (!fits) allFit = false;

    return {
      axis,
      label,
      itemValue: fromMillimetres(itemMm, unit),
      spaceValue: fromMillimetres(spaceMm, unit),
      clearance: fromMillimetres(diffMm, unit),
      fits,
    };
  });

  return {
    unit,
    overallFits: comparableAxes === 0 ? null : allFit,
    comparableAxes,
    axes,
  };
}

export interface WarrantyCheckItem {
  _id: string;
  name: string;
  warrantyExpiryDate?: string;
  isArchived?: boolean;
  movingStatus: string;
}

/**
 * Returns active catalog items whose warranty expires within `days` from today
 * (inclusive of today; excludes already-expired warranties older than today).
 */
export function getExpiringWarranties<T extends WarrantyCheckItem>(
  items: T[],
  days = 30,
  todayIso?: string,
): T[] {
  const today = todayIso || new Date().toISOString().slice(0, 10);
  const startMs = Date.parse(`${today}T00:00:00Z`);
  if (!Number.isFinite(startMs)) return [];
  const cutoffIso = new Date(startMs + days * 86_400_000)
    .toISOString()
    .slice(0, 10);

  return items
    .filter((item) => {
      if (item.isArchived || isArchivedMovingStatus(item.movingStatus)) {
        return false;
      }
      if (!item.warrantyExpiryDate) return false;
      return item.warrantyExpiryDate >= today && item.warrantyExpiryDate <= cutoffIso;
    })
    .sort((a, b) =>
      (a.warrantyExpiryDate ?? "").localeCompare(b.warrantyExpiryDate ?? ""),
    );
}

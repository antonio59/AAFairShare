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

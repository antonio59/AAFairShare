import { Id } from "../../../convex/_generated/dataModel";
import {
  formatDimensions,
  isArchivedMovingStatus,
  type CatalogEntryType,
  type DimensionUnit,
  type MovingStatus,
  type WeightUnit,
} from "../../../convex/utils/homeCatalog";

export interface CatalogLinkedDocument {
  _id: Id<"documents">;
  type: string;
  title?: string;
  fileType: string;
  date: string;
  expiryDate?: string;
  url: string | null;
}

export interface CatalogLinkedExpense {
  _id: Id<"expenses">;
  amount: number;
  date: string;
  description: string;
  location: string;
}

export interface CatalogPhoto {
  storageId: Id<"_storage">;
  url: string | null;
}

export interface CatalogItem {
  _id: Id<"homeCatalogItems">;
  entryType: CatalogEntryType | string;
  name: string;
  category: string;
  room: string;
  addressId?: Id<"addresses">;
  addressName?: string | null;
  brand?: string;
  modelNumber?: string;
  serialNumber?: string;
  width?: number;
  depth?: number;
  height?: number;
  dimensionUnit?: DimensionUnit | string;
  weight?: number;
  weightUnit?: WeightUnit | string;
  measurementNotes?: string;
  purchasePrice?: number;
  purchaseDate?: string;
  retailer?: string;
  warrantyExpiryDate?: string;
  linkedExpenseId?: Id<"expenses">;
  linkedExpense?: CatalogLinkedExpense | null;
  photoStorageIds?: Id<"_storage">[];
  photos: CatalogPhoto[];
  linkedDocumentIds?: Id<"documents">[];
  linkedDocuments: CatalogLinkedDocument[];
  movingStatus: MovingStatus | string;
  salePrice?: number;
  isArchived?: boolean;
  archivedAt?: number;
  notes?: string;
  createdBy?: Id<"users">;
  createdByName?: string;
  createdAt: number;
  updatedAt: number;
}

export const ITEM_CATEGORIES = [
  "Appliance",
  "Furniture",
  "Electronics",
  "Kitchen",
  "Lighting",
  "Storage",
  "Decor",
  "Bedding & Textiles",
  "Tools & DIY",
  "Outdoor & Garden",
  "Other",
] as const;

export const SPACE_CATEGORIES = [
  "Window / Curtain",
  "Alcove / Gap",
  "Doorway / Stairwell",
  "Room / Wall",
  "Floor / Rug Area",
  "Cupboard / Wardrobes",
  "Outdoor / Patio",
  "Other",
] as const;

export const DEFAULT_ROOMS = [
  "Living Room",
  "Kitchen",
  "Dining Room",
  "Master Bedroom",
  "Bedroom 2",
  "Bedroom 3",
  "Bathroom",
  "Hallway",
  "Utility",
  "Home Office",
  "Garden / Garage",
  "Loft / Storage",
  "Other",
] as const;

export const DIMENSION_UNITS: Array<{ value: DimensionUnit; label: string }> = [
  { value: "cm", label: "cm" },
  { value: "mm", label: "mm" },
  { value: "m", label: "m" },
  { value: "in", label: "in" },
  { value: "ft", label: "ft" },
];

export const WEIGHT_UNITS: Array<{ value: WeightUnit; label: string }> = [
  { value: "kg", label: "kg" },
  { value: "lbs", label: "lbs" },
];

export interface MovingStatusMeta {
  value: MovingStatus;
  label: string;
  shortLabel: string;
  badgeClass: string;
  isArchived: boolean;
}

export const MOVING_STATUS_OPTIONS: MovingStatusMeta[] = [
  {
    value: "keeping",
    label: "Moving / Keeping",
    shortLabel: "Keeping",
    badgeClass:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    isArchived: false,
  },
  {
    value: "plan_sell",
    label: "Plan to Sell",
    shortLabel: "Plan to Sell",
    badgeClass:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    isArchived: false,
  },
  {
    value: "plan_donate",
    label: "Plan to Donate",
    shortLabel: "Plan to Donate",
    badgeClass:
      "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
    isArchived: false,
  },
  {
    value: "stays",
    label: "Stays with Property",
    shortLabel: "Stays",
    badgeClass:
      "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
    isArchived: false,
  },
  {
    value: "undecided",
    label: "Undecided",
    shortLabel: "Undecided",
    badgeClass:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
    isArchived: false,
  },
  {
    value: "sold",
    label: "Sold (Archived)",
    shortLabel: "Sold",
    badgeClass:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    isArchived: true,
  },
  {
    value: "donated",
    label: "Donated (Archived)",
    shortLabel: "Donated",
    badgeClass:
      "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
    isArchived: true,
  },
  {
    value: "binned",
    label: "Binned (Archived)",
    shortLabel: "Binned",
    badgeClass:
      "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
    isArchived: true,
  },
];

export function getMovingStatusMeta(status: string): MovingStatusMeta {
  return (
    MOVING_STATUS_OPTIONS.find((s) => s.value === status) ??
    MOVING_STATUS_OPTIONS[0]
  );
}

export function isItemArchived(item: Pick<CatalogItem, "isArchived" | "movingStatus">): boolean {
  return Boolean(item.isArchived || isArchivedMovingStatus(item.movingStatus));
}

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str = String(value);
  // Neutralize spreadsheet formula injection when opened in Excel / Google Sheets
  if (FORMULA_PREFIX.test(str)) {
    str = `'${str}`;
  }
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportCatalogToCsv(items: CatalogItem[], filename = "home-catalog.csv") {
  const headers = [
    "Type",
    "Name",
    "Room",
    "Category",
    "Property",
    "Brand",
    "Model",
    "Serial",
    "Dimensions",
    "Width",
    "Depth",
    "Height",
    "Unit",
    "Weight",
    "Measurement Notes",
    "Purchase Price (GBP)",
    "Purchase Date",
    "Retailer",
    "Warranty Expiry",
    "Moving Status",
    "Sale Price (GBP)",
    "Archived",
    "Linked Documents",
    "Notes",
  ];

  const rows = items.map((item) => [
    item.entryType === "space" ? "Space / Measurement" : "Item / Appliance",
    item.name,
    item.room,
    item.category,
    item.addressName ?? "",
    item.brand ?? "",
    item.modelNumber ?? "",
    item.serialNumber ?? "",
    formatDimensions(item) ?? "",
    item.width ?? "",
    item.depth ?? "",
    item.height ?? "",
    item.dimensionUnit ?? "cm",
    item.weight !== undefined ? `${item.weight} ${item.weightUnit ?? "kg"}` : "",
    item.measurementNotes ?? "",
    item.purchasePrice ?? "",
    item.purchaseDate ?? "",
    item.retailer ?? "",
    item.warrantyExpiryDate ?? "",
    getMovingStatusMeta(item.movingStatus).shortLabel,
    item.salePrice ?? "",
    isItemArchived(item) ? "Yes" : "No",
    item.linkedDocuments.map((d) => d.title || d.type).join("; "),
    item.notes ?? "",
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

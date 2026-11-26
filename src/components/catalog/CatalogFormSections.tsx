import { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEMO_MODE } from "@/lib/demoData";
import { formatCurrency } from "@/lib/money";
import { Id } from "../../../convex/_generated/dataModel";
import {
  type CatalogEntryType,
  type DimensionUnit,
  type WeightUnit,
} from "../../../convex/utils/homeCatalog";
import { DIMENSION_UNITS, WEIGHT_UNITS } from "./catalogConstants";
import {
  BookOpen,
  Camera,
  Check,
  FileText,
  Link2,
  Loader2,
  Ruler,
  Search,
  Upload,
  X,
} from "lucide-react";

export interface PhotoPreview {
  storageId: Id<"_storage">;
  url: string | null;
  isObjectUrl?: boolean;
}

export interface LinkableExpense {
  _id: Id<"expenses">;
  amount: number;
  date: string;
  description: string;
  location: string;
}

interface LinkableDocument {
  _id: Id<"documents">;
  type: string;
  title?: string;
  date: string;
}

interface MeasurementsSectionProps {
  entryType: CatalogEntryType;
  width: string;
  depth: string;
  height: string;
  dimensionUnit: DimensionUnit;
  weight: string;
  weightUnit: WeightUnit;
  measurementNotes: string;
  onChange: (patch: {
    width?: string;
    depth?: string;
    height?: string;
    dimensionUnit?: DimensionUnit;
    weight?: string;
    weightUnit?: WeightUnit;
    measurementNotes?: string;
  }) => void;
}

export const CatalogMeasurementsSection = ({
  entryType,
  width,
  depth,
  height,
  dimensionUnit,
  weight,
  weightUnit,
  measurementNotes,
  onChange,
}: MeasurementsSectionProps) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <Label className="text-sm font-semibold flex items-center gap-1.5">
        <Ruler className="h-4 w-4 text-primary" />
        Measurements
      </Label>
      <Select
        value={dimensionUnit}
        onValueChange={(v) => onChange({ dimensionUnit: v as DimensionUnit })}
      >
        <SelectTrigger className="w-24 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DIMENSION_UNITS.map((u) => (
            <SelectItem key={u.value} value={u.value}>
              {u.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="grid grid-cols-3 gap-3">
      <div className="space-y-1">
        <Label htmlFor="catalog-width" className="text-xs text-muted-foreground">
          Width ({dimensionUnit})
        </Label>
        <Input
          id="catalog-width"
          type="number"
          step="any"
          min="0"
          value={width}
          onChange={(e) => onChange({ width: e.target.value })}
          placeholder="W"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="catalog-depth" className="text-xs text-muted-foreground">
          Depth ({dimensionUnit})
        </Label>
        <Input
          id="catalog-depth"
          type="number"
          step="any"
          min="0"
          value={depth}
          onChange={(e) => onChange({ depth: e.target.value })}
          placeholder="D"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="catalog-height" className="text-xs text-muted-foreground">
          Height ({dimensionUnit})
        </Label>
        <Input
          id="catalog-height"
          type="number"
          step="any"
          min="0"
          value={height}
          onChange={(e) => onChange({ height: e.target.value })}
          placeholder="H"
        />
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {entryType === "item" && (
        <div className="space-y-1">
          <Label htmlFor="catalog-weight" className="text-xs text-muted-foreground">
            Weight (optional)
          </Label>
          <div className="flex gap-1.5">
            <Input
              id="catalog-weight"
              type="number"
              step="any"
              min="0"
              value={weight}
              onChange={(e) => onChange({ weight: e.target.value })}
              placeholder="e.g. 67"
            />
            <Select
              value={weightUnit}
              onValueChange={(v) => onChange({ weightUnit: v as WeightUnit })}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEIGHT_UNITS.map((u) => (
                  <SelectItem key={u.value} value={u.value}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      <div
        className={
          entryType === "item"
            ? "sm:col-span-2 space-y-1"
            : "sm:col-span-3 space-y-1"
        }
      >
        <Label htmlFor="catalog-mnotes" className="text-xs text-muted-foreground">
          Measurement / Clearance Notes
        </Label>
        <Input
          id="catalog-mnotes"
          value={measurementNotes}
          onChange={(e) => onChange({ measurementNotes: e.target.value })}
          placeholder="e.g. Needs 72 cm doorway; allow 5 cm behind for hoses"
        />
      </div>
    </div>
  </div>
);

interface PurchaseSectionProps {
  purchasePrice: string;
  purchaseDate: string;
  retailer: string;
  warrantyExpiryDate: string;
  linkedExpenseId: Id<"expenses"> | null;
  linkedExpenseLabel: string;
  showExpensePicker: boolean;
  expenseSearch: string;
  expensesForLinking: LinkableExpense[] | undefined;
  onToggleExpensePicker: () => void;
  onExpenseSearchChange: (val: string) => void;
  onSelectExpense: (exp: LinkableExpense) => void;
  onUnlinkExpense: () => void;
  onChange: (patch: {
    purchasePrice?: string;
    purchaseDate?: string;
    retailer?: string;
    warrantyExpiryDate?: string;
  }) => void;
}

export const CatalogPurchaseSection = ({
  purchasePrice,
  purchaseDate,
  retailer,
  warrantyExpiryDate,
  linkedExpenseId,
  linkedExpenseLabel,
  showExpensePicker,
  expenseSearch,
  expensesForLinking,
  onToggleExpensePicker,
  onExpenseSearchChange,
  onSelectExpense,
  onUnlinkExpense,
  onChange,
}: PurchaseSectionProps) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <Label className="text-sm font-semibold">Purchase & Warranty</Label>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        onClick={onToggleExpensePicker}
      >
        <Link2 className="h-3.5 w-3.5" />
        {linkedExpenseId ? "Change Linked Expense" : "Link Existing Expense"}
      </Button>
    </div>

    {linkedExpenseId && (
      <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs">
        <span className="truncate">
          Linked expense:{" "}
          <strong className="font-medium">
            {linkedExpenseLabel || "Expense linked"}
          </strong>
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={onUnlinkExpense}
        >
          Unlink
        </Button>
      </div>
    )}

    {showExpensePicker && (
      <div className="rounded-lg border p-3 space-y-2 bg-muted/20">
        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input
            value={expenseSearch}
            onChange={(e) => onExpenseSearchChange(e.target.value)}
            placeholder="Search expenses by store, description, or date..."
            className="pl-8 h-8 text-xs"
          />
        </div>
        <div className="max-h-40 overflow-y-auto space-y-1">
          {expensesForLinking === undefined ? (
            <p className="text-xs text-muted-foreground py-2 text-center">
              Loading expenses...
            </p>
          ) : expensesForLinking.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 text-center">
              No matching expenses found.
            </p>
          ) : (
            expensesForLinking.map((exp) => (
              <button
                key={exp._id}
                type="button"
                onClick={() => onSelectExpense(exp)}
                className="w-full flex items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-accent transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {exp.description || exp.location}
                  </p>
                  <p className="text-muted-foreground truncate">
                    {exp.location} · {exp.date}
                  </p>
                </div>
                <span className="font-semibold tabular-nums shrink-0">
                  {formatCurrency(exp.amount)}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    )}

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label htmlFor="catalog-price" className="text-xs text-muted-foreground">
          Purchase Price (£)
        </Label>
        <Input
          id="catalog-price"
          type="number"
          step="0.01"
          min="0"
          value={purchasePrice}
          onChange={(e) => onChange({ purchasePrice: e.target.value })}
          placeholder="0.00"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="catalog-retailer" className="text-xs text-muted-foreground">
          Retailer / Store
        </Label>
        <Input
          id="catalog-retailer"
          value={retailer}
          onChange={(e) => onChange({ retailer: e.target.value })}
          placeholder="e.g. John Lewis, Currys, IKEA"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="catalog-pdate" className="text-xs text-muted-foreground">
          Purchase Date
        </Label>
        <Input
          id="catalog-pdate"
          type="date"
          value={purchaseDate}
          onChange={(e) => onChange({ purchaseDate: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="catalog-warranty" className="text-xs text-muted-foreground">
          Warranty Expiry Date
        </Label>
        <Input
          id="catalog-warranty"
          type="date"
          value={warrantyExpiryDate}
          onChange={(e) => onChange({ warrantyExpiryDate: e.target.value })}
        />
      </div>
    </div>
  </div>
);

interface PhotosSectionProps {
  photos: PhotoPreview[];
  isUploadingPhoto: boolean;
  photoInputRef: RefObject<HTMLInputElement | null>;
  onUploadPhoto: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: (photo: PhotoPreview) => void;
}

export const CatalogPhotosSection = ({
  photos,
  isUploadingPhoto,
  photoInputRef,
  onUploadPhoto,
  onRemovePhoto,
}: PhotosSectionProps) => (
  <div className="space-y-2.5">
    <div className="flex items-center justify-between gap-2">
      <Label className="text-sm font-semibold">
        Photos{" "}
        <span className="font-normal text-xs text-muted-foreground">
          (up to 10 — item, room, or serial sticker)
        </span>
      </Label>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        disabled={isUploadingPhoto || DEMO_MODE || photos.length >= 10}
        onClick={() => photoInputRef.current?.click()}
      >
        {isUploadingPhoto ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Camera className="h-3.5 w-3.5" />
        )}
        Add Photo
      </Button>
      <input
        ref={photoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
        multiple
        className="hidden"
        onChange={onUploadPhoto}
        disabled={isUploadingPhoto || DEMO_MODE}
      />
    </div>
    {DEMO_MODE && (
      <p className="text-xs text-muted-foreground">
        Photo and manual uploads are disabled in demo mode.
      </p>
    )}
    {photos.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {photos.map((photo) => (
          <div
            key={photo.storageId}
            className="relative h-20 w-20 rounded-lg border overflow-hidden bg-muted"
          >
            {photo.url ? (
              <img
                src={photo.url}
                alt="Catalog photo"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                <Camera className="h-5 w-5" />
              </div>
            )}
            <button
              type="button"
              onClick={() => onRemovePhoto(photo)}
              aria-label="Remove photo"
              className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);

interface DocumentsSectionProps {
  linkedDocumentIds: Id<"documents">[];
  linkedDocsDetails: LinkableDocument[];
  sortedDocuments: LinkableDocument[];
  showDocPicker: boolean;
  docSearch: string;
  isUploadingManual: boolean;
  manualInputRef: RefObject<HTMLInputElement | null>;
  onToggleDocPicker: () => void;
  onDocSearchChange: (val: string) => void;
  onToggleDocument: (id: Id<"documents">) => void;
  onQuickUploadManual: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CatalogDocumentsSection = ({
  linkedDocumentIds,
  linkedDocsDetails,
  sortedDocuments,
  showDocPicker,
  docSearch,
  isUploadingManual,
  manualInputRef,
  onToggleDocPicker,
  onDocSearchChange,
  onToggleDocument,
  onQuickUploadManual,
}: DocumentsSectionProps) => (
  <div className="space-y-2.5">
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <Label className="text-sm font-semibold flex items-center gap-1.5">
        <BookOpen className="h-4 w-4 text-primary" />
        Manuals & Documents
      </Label>
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          disabled={isUploadingManual || DEMO_MODE}
          onClick={() => manualInputRef.current?.click()}
        >
          {isUploadingManual ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          Upload Manual
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={onToggleDocPicker}
        >
          <FileText className="h-3.5 w-3.5" />
          Link from Documents
        </Button>
        <input
          ref={manualInputRef}
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={onQuickUploadManual}
          disabled={isUploadingManual || DEMO_MODE}
        />
      </div>
    </div>

    {linkedDocsDetails.length > 0 && (
      <div className="flex flex-wrap gap-1.5">
        {linkedDocsDetails.map((doc) => (
          <Badge
            key={doc._id}
            variant="secondary"
            className="gap-1.5 pr-1.5 py-1 text-xs"
          >
            <span className="capitalize text-muted-foreground">
              [{doc.type}]
            </span>
            <span className="max-w-[200px] truncate">
              {doc.title || "Untitled document"}
            </span>
            <button
              type="button"
              onClick={() => onToggleDocument(doc._id)}
              aria-label={`Unlink ${doc.title || "document"}`}
              className="rounded-full hover:bg-muted p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    )}

    {showDocPicker && (
      <div className="rounded-lg border p-3 space-y-2 bg-muted/20">
        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input
            value={docSearch}
            onChange={(e) => onDocSearchChange(e.target.value)}
            placeholder="Filter uploaded manuals, warranties, receipts..."
            className="pl-8 h-8 text-xs"
          />
        </div>
        <div className="max-h-44 overflow-y-auto space-y-1">
          {sortedDocuments.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 text-center">
              No documents found. Upload one in Documents or click
              &ldquo;Upload Manual&rdquo; above.
            </p>
          ) : (
            sortedDocuments.map((doc) => {
              const selected = linkedDocumentIds.includes(doc._id);
              return (
                <button
                  key={doc._id}
                  type="button"
                  onClick={() => onToggleDocument(doc._id)}
                  className={`w-full flex items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors ${
                    selected
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent"
                  }`}
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] capitalize shrink-0"
                    >
                      {doc.type}
                    </Badge>
                    <span className="truncate font-medium">
                      {doc.title || "Untitled"}
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      {doc.date}
                    </span>
                  </div>
                  {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    )}
  </div>
);

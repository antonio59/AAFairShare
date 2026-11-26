import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/money";
import { formatDimensions } from "../../../convex/utils/homeCatalog";
import {
  getMovingStatusMeta,
  isItemArchived,
  type CatalogItem,
} from "./catalogConstants";
import {
  ArchiveRestore,
  BookOpen,
  Calendar,
  Copy,
  Edit,
  ExternalLink,
  FileText,
  Home,
  Package,
  Ruler,
  ShieldCheck,
  Store,
  Tag,
  Trash2,
  Weight,
  Wrench,
} from "lucide-react";

interface CatalogItemDetailDialogProps {
  item: CatalogItem | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (item: CatalogItem) => void;
  onDelete: (item: CatalogItem) => void;
  onMarkStatus: (
    item: CatalogItem,
    status: "keeping" | "sold" | "donated" | "binned",
  ) => void;
}

const CatalogItemDetailDialog = ({
  item,
  onOpenChange,
  onEdit,
  onDelete,
  onMarkStatus,
}: CatalogItemDetailDialogProps) => {
  const navigate = useNavigate();
  const [enlargedPhotoUrl, setEnlargedPhotoUrl] = useState<string | null>(null);

  if (!item) return null;

  const dimensions = formatDimensions(item);
  const statusMeta = getMovingStatusMeta(item.movingStatus);
  const archived = isItemArchived(item);

  const copyText = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: `${label} copied`, description: value });
    } catch {
      toast({
        title: "Copy failed",
        description: value,
      });
    }
  };

  return (
    <>
      <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3 pr-6">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="text-xs gap-1">
                    {item.entryType === "space" ? (
                      <Ruler className="h-3 w-3" />
                    ) : (
                      <Package className="h-3 w-3" />
                    )}
                    {item.entryType === "space" ? "Space" : item.category}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {item.room}
                  </Badge>
                  <Badge className={`text-xs border-0 ${statusMeta.badgeClass}`}>
                    {statusMeta.shortLabel}
                  </Badge>
                </div>
                <DialogTitle className="text-xl">{item.name}</DialogTitle>
                {(item.brand || item.addressName) && (
                  <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {item.brand && <span>{item.brand}</span>}
                    {item.addressName && (
                      <span className="inline-flex items-center gap-1">
                        <Home className="h-3 w-3" />
                        {item.addressName}
                      </span>
                    )}
                  </DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Photos */}
            {item.photos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {item.photos.map((photo) =>
                  photo.url ? (
                    <button
                      key={photo.storageId}
                      type="button"
                      onClick={() => setEnlargedPhotoUrl(photo.url)}
                      className="h-28 w-28 shrink-0 rounded-lg border overflow-hidden hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={photo.url}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ) : null,
                )}
              </div>
            )}

            {/* Measurements */}
            {(dimensions || item.weight !== undefined || item.measurementNotes) && (
              <div className="rounded-lg border bg-muted/30 p-3.5 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <Ruler className="h-3.5 w-3.5" />
                  Measurements
                </h4>
                <div className="flex flex-wrap items-center gap-4">
                  {dimensions && (
                    <p className="text-base font-semibold tabular-nums">
                      {dimensions}
                    </p>
                  )}
                  {item.weight !== undefined && (
                    <p className="text-sm text-muted-foreground inline-flex items-center gap-1 tabular-nums">
                      <Weight className="h-3.5 w-3.5" />
                      {item.weight} {item.weightUnit || "kg"}
                    </p>
                  )}
                </div>
                {item.measurementNotes && (
                  <p className="text-sm text-muted-foreground">
                    {item.measurementNotes}
                  </p>
                )}
              </div>
            )}

            {/* Identifiers (Model / Serial) */}
            {(item.modelNumber || item.serialNumber) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {item.modelNumber && (
                  <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground">
                        Model Number
                      </p>
                      <p className="text-sm font-mono truncate">
                        {item.modelNumber}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => copyText("Model number", item.modelNumber!)}
                      aria-label="Copy model number"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
                {item.serialNumber && (
                  <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground">
                        Serial Number
                      </p>
                      <p className="text-sm font-mono truncate">
                        {item.serialNumber}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() =>
                        copyText("Serial number", item.serialNumber!)
                      }
                      aria-label="Copy serial number"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Purchase & Warranty */}
            {(item.purchasePrice !== undefined ||
              item.purchaseDate ||
              item.retailer ||
              item.warrantyExpiryDate ||
              item.salePrice !== undefined) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {item.purchasePrice !== undefined && (
                  <div className="rounded-lg border px-3 py-2">
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Purchased For
                    </p>
                    <p className="text-sm font-semibold tabular-nums">
                      {formatCurrency(item.purchasePrice)}
                    </p>
                  </div>
                )}
                {item.retailer && (
                  <div className="rounded-lg border px-3 py-2">
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Store className="h-3 w-3" />
                      Retailer
                    </p>
                    <p className="text-sm font-medium truncate">
                      {item.retailer}
                    </p>
                  </div>
                )}
                {item.purchaseDate && (
                  <div className="rounded-lg border px-3 py-2">
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Purchase Date
                    </p>
                    <p className="text-sm font-medium tabular-nums">
                      {item.purchaseDate}
                    </p>
                  </div>
                )}
                {item.warrantyExpiryDate && (
                  <div className="rounded-lg border px-3 py-2">
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      Warranty Until
                    </p>
                    <p className="text-sm font-medium tabular-nums">
                      {item.warrantyExpiryDate}
                    </p>
                  </div>
                )}
                {item.salePrice !== undefined && (
                  <div className="rounded-lg border px-3 py-2">
                    <p className="text-[11px] text-muted-foreground">
                      {item.movingStatus === "sold" ? "Sold For" : "Target Sale"}
                    </p>
                    <p className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(item.salePrice)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {item.linkedExpense && (
              <div className="rounded-md bg-muted/40 border px-3 py-2 text-xs text-muted-foreground">
                Linked expense:{" "}
                <span className="font-medium text-foreground">
                  {item.linkedExpense.description || item.linkedExpense.location}
                </span>{" "}
                — {formatCurrency(item.linkedExpense.amount)} on{" "}
                {item.linkedExpense.date}
              </div>
            )}

            {/* Linked Documents & Manuals */}
            {item.linkedDocuments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  Linked Manuals & Documents ({item.linkedDocuments.length})
                </h4>
                <div className="space-y-1.5">
                  {item.linkedDocuments.map((doc) => (
                    <div
                      key={doc._id}
                      className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        {doc.type === "manual" ? (
                          <BookOpen className="h-4 w-4 text-indigo-600 shrink-0" />
                        ) : (
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {doc.title || "Untitled document"}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {doc.type} · {doc.fileType.toUpperCase()}
                            {doc.expiryDate ? ` · Expires ${doc.expiryDate}` : ""}
                          </p>
                        </div>
                      </div>
                      {doc.url ? (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 text-xs shrink-0"
                        >
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          Preview N/A
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {item.notes && (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Notes
                </h4>
                <p className="text-sm whitespace-pre-wrap text-foreground/90">
                  {item.notes}
                </p>
              </div>
            )}

            <Separator />

            {/* Quick Lifecycle Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {archived ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => onMarkStatus(item, "keeping")}
                  >
                    <ArchiveRestore className="h-3.5 w-3.5" />
                    Restore to Active
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMarkStatus(item, "sold")}
                    >
                      Mark Sold
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMarkStatus(item, "donated")}
                    >
                      Mark Donated
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMarkStatus(item, "binned")}
                    >
                      Mark Binned
                    </Button>
                  </>
                )}
                {item.entryType !== "space" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      onOpenChange(false);
                      navigate(`/maintenance?catalogItemId=${item._id}`);
                    }}
                  >
                    <Wrench className="h-3.5 w-3.5" />
                    Log Issue
                    {(item.openMaintenanceCount ?? 0) > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-0.5 px-1.5 py-0 text-[10px]"
                      >
                        {item.openMaintenanceCount}
                      </Badge>
                    )}
                  </Button>
                )}
              </div>

              <DialogFooter className="sm:justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive gap-1.5"
                  onClick={() => onDelete(item)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => onEdit(item)}
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Lightbox */}
      <Dialog
        open={Boolean(enlargedPhotoUrl)}
        onOpenChange={(open) => !open && setEnlargedPhotoUrl(null)}
      >
        <DialogContent className="max-w-3xl p-2">
          {enlargedPhotoUrl && (
            <img
              src={enlargedPhotoUrl}
              alt={item.name}
              className="w-full max-h-[80vh] object-contain rounded"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CatalogItemDetailDialog;

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/money";
import { formatDimensions } from "../../../convex/utils/homeCatalog";
import {
  getMovingStatusMeta,
  isItemArchived,
  type CatalogItem,
} from "./catalogConstants";
import {
  Archive,
  ArchiveRestore,
  BookOpen,
  Edit,
  ExternalLink,
  FileText,
  Home,
  MoreVertical,
  Package,
  Ruler,
  Trash2,
} from "lucide-react";

interface CatalogItemCardProps {
  item: CatalogItem;
  onSelect: (item: CatalogItem) => void;
  onEdit: (item: CatalogItem) => void;
  onDelete: (item: CatalogItem) => void;
  onStatusChange: (
    item: CatalogItem,
    status: "keeping" | "sold" | "donated" | "binned",
  ) => void;
}

const CatalogItemCard = ({
  item,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
}: CatalogItemCardProps) => {
  const dimensions = formatDimensions(item);
  const statusMeta = getMovingStatusMeta(item.movingStatus);
  const archived = isItemArchived(item);
  const coverPhoto = item.photos.find((p) => p.url)?.url ?? null;
  const manualDocs = item.linkedDocuments.filter((d) => d.type === "manual");
  const otherDocsCount = item.linkedDocuments.length - manualDocs.length;

  return (
    <Card
      className="group overflow-hidden transition-shadow hover:shadow-md flex flex-col cursor-pointer"
      onClick={() => onSelect(item)}
    >
      <div className="flex gap-3 p-4 flex-1">
        <div className="h-16 w-16 shrink-0 rounded-lg border bg-muted/50 overflow-hidden flex items-center justify-center">
          {coverPhoto ? (
            <img
              src={coverPhoto}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          ) : item.entryType === "space" ? (
            <Ruler className="h-6 w-6 text-muted-foreground" />
          ) : (
            <Package className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-sm leading-snug truncate">
                {item.name}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {item.room} · {item.category}
                {item.brand ? ` · ${item.brand}` : ""}
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 -mr-1.5 -mt-1 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Item actions"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuItem onClick={() => onEdit(item)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {archived ? (
                  <DropdownMenuItem
                    onClick={() => onStatusChange(item, "keeping")}
                  >
                    <ArchiveRestore className="mr-2 h-4 w-4" />
                    Restore to Active
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem
                      onClick={() => onStatusChange(item, "sold")}
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Mark Sold (Archive)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onStatusChange(item, "donated")}
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Mark Donated (Archive)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onStatusChange(item, "binned")}
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Mark Binned (Archive)
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(item)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {dimensions && (
            <div className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
              <Ruler className="h-3 w-3 text-primary shrink-0" />
              <span>{dimensions}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <Badge className={`text-[11px] border-0 ${statusMeta.badgeClass}`}>
              {statusMeta.shortLabel}
            </Badge>
            {item.purchasePrice !== undefined && (
              <Badge variant="outline" className="text-[11px] tabular-nums">
                {formatCurrency(item.purchasePrice)}
              </Badge>
            )}
            {item.movingStatus === "sold" && item.salePrice !== undefined && (
              <Badge
                variant="outline"
                className="text-[11px] tabular-nums text-emerald-700 dark:text-emerald-400"
              >
                Sold {formatCurrency(item.salePrice)}
              </Badge>
            )}
            {item.modelNumber && (
              <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[140px]">
                {item.modelNumber}
              </span>
            )}
          </div>
        </div>
      </div>

      {(item.linkedDocuments.length > 0 || item.addressName) && (
        <div className="border-t bg-muted/20 px-4 py-2 flex items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {manualDocs.slice(0, 1).map((doc) =>
              doc.url ? (
                <a
                  key={doc._id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-indigo-700 dark:text-indigo-300 hover:underline font-medium truncate"
                >
                  <BookOpen className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate max-w-[160px]">
                    {doc.title || "Manual"}
                  </span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              ) : (
                <span
                  key={doc._id}
                  className="inline-flex items-center gap-1 text-indigo-700 dark:text-indigo-300 font-medium truncate"
                >
                  <BookOpen className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate max-w-[160px]">
                    {doc.title || "Manual"}
                  </span>
                </span>
              ),
            )}
            {manualDocs.length > 1 && (
              <span className="text-muted-foreground">
                +{manualDocs.length - 1} manuals
              </span>
            )}
            {otherDocsCount > 0 && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <FileText className="h-3 w-3" />
                {otherDocsCount} doc{otherDocsCount > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {item.addressName && (
            <span className="inline-flex items-center gap-1 text-muted-foreground truncate max-w-[140px] shrink-0">
              <Home className="h-3 w-3 shrink-0" />
              <span className="truncate">{item.addressName}</span>
            </span>
          )}
        </div>
      )}
    </Card>
  );
};

export default CatalogItemCard;

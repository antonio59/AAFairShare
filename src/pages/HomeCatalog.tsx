import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/money";
import {
  useActiveAddresses,
  useDeleteHomeCatalogItem,
  useHomeCatalogItems,
  useSetHomeCatalogMovingStatus,
} from "@/hooks/useConvexData";
import {
  ACTIVE_MOVING_STATUSES,
  computeCatalogSummary,
  getExpiringWarranties,
  type CatalogEntryType,
} from "../../convex/utils/homeCatalog";
import { Id } from "../../convex/_generated/dataModel";
import {
  exportCatalogToCsv,
  getMovingStatusMeta,
  isItemArchived,
  MOVING_STATUS_OPTIONS,
  type CatalogItem,
} from "@/components/catalog/catalogConstants";
import CatalogItemCard from "@/components/catalog/CatalogItemCard";
import CatalogItemDialog, {
  type CatalogExpensePrefill,
} from "@/components/catalog/CatalogItemDialog";
import CatalogItemDetailDialog from "@/components/catalog/CatalogItemDetailDialog";
import FitCheckerDialog from "@/components/catalog/FitCheckerDialog";
import {
  AlertTriangle,
  Archive,
  BookOpen,
  Download,
  FileDown,
  Loader2,
  Package,
  Plus,
  Ruler,
  Search,
  Truck,
  Wallet,
} from "lucide-react";

type CatalogTab = "active" | "items" | "spaces" | "moving" | "archived";

function matchesSearch(item: CatalogItem, q: string): boolean {
  if (!q) return true;
  const fields = [
    item.name,
    item.room,
    item.category,
    item.brand,
    item.modelNumber,
    item.serialNumber,
    item.retailer,
    item.notes,
    item.measurementNotes,
    ...item.linkedDocuments.map((d) => d.title),
  ];
  return fields.some((f) => f?.toLowerCase().includes(q));
}

const HomeCatalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawItems = useHomeCatalogItems();
  const activeAddresses = useActiveAddresses();
  const setMovingStatus = useSetHomeCatalogMovingStatus();
  const deleteItem = useDeleteHomeCatalogItem();

  const [activeTab, setActiveTab] = useState<CatalogTab>("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [roomFilter, setRoomFilter] = useState("all");
  const [addressFilter, setAddressFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const initialPrefill = useMemo<CatalogExpensePrefill | null>(() => {
    const expId = searchParams.get("fromExpense");
    if (!expId) return null;
    const amt = Number(searchParams.get("amount") || "0");
    return {
      id: expId as Id<"expenses">,
      amount: Number.isFinite(amt) ? amt : 0,
      date: searchParams.get("date") || "",
      description: searchParams.get("description") || "",
      location: searchParams.get("location") || "",
    };
  }, [searchParams]);

  const [isFormOpen, setIsFormOpen] = useState(() => Boolean(initialPrefill));
  const [isFitCheckerOpen, setIsFitCheckerOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [defaultEntryType, setDefaultEntryType] =
    useState<CatalogEntryType>("item");
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [detailItemId, setDetailItemId] = useState<string | null>(
    () => searchParams.get("item"),
  );
  const [deletingItem, setDeletingItem] = useState<CatalogItem | null>(null);
  const [sellingItem, setSellingItem] = useState<CatalogItem | null>(null);
  const [salePriceInput, setSalePriceInput] = useState("");

  const items = useMemo<CatalogItem[]>(
    () => (rawItems as CatalogItem[] | undefined) ?? [],
    [rawItems],
  );

  const expiringWarranties = useMemo(
    () => getExpiringWarranties(items, 30),
    [items],
  );

  const detailItem = useMemo(
    () => items.find((i) => i._id === detailItemId) ?? null,
    [items, detailItemId],
  );

  const summary = useMemo(() => computeCatalogSummary(items), [items]);

  const uniqueRooms = useMemo(() => {
    const rooms = new Set(items.map((i) => i.room).filter(Boolean));
    return Array.from(rooms).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      const archived = isItemArchived(item);
      if (activeTab === "archived" ? !archived : archived) return false;
      if (activeTab === "items" && item.entryType !== "item") return false;
      if (activeTab === "spaces" && item.entryType !== "space") return false;
      if (roomFilter !== "all" && item.room !== roomFilter) return false;
      if (addressFilter !== "all" && item.addressId !== addressFilter)
        return false;
      if (statusFilter !== "all" && item.movingStatus !== statusFilter)
        return false;
      return matchesSearch(item, q);
    });
  }, [items, activeTab, searchTerm, roomFilter, addressFilter, statusFilter]);

  const openCreateDialog = (kind: CatalogEntryType = "item") => {
    setEditingItem(null);
    setDefaultEntryType(kind);
    setIsFormOpen(true);
  };

  const openEditDialog = (item: CatalogItem) => {
    setDetailItemId(null);
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleStatusChange = async (
    item: CatalogItem,
    status: "keeping" | "sold" | "donated" | "binned",
  ) => {
    if (status === "sold") {
      setSellingItem(item);
      setSalePriceInput(
        item.salePrice !== undefined ? String(item.salePrice) : "",
      );
      return;
    }

    try {
      await setMovingStatus({ id: item._id, movingStatus: status });
      if (status === "keeping") {
        toast({
          title: "Restored to active catalog",
          description: `${item.name} is back in your active catalog.`,
        });
      } else {
        const label = status === "donated" ? "Donated" : "Binned";
        toast({
          title: `Marked as ${label} & archived`,
          description: `${item.name} has been moved to the Archived tab.`,
        });
        if (detailItemId === item._id) setDetailItemId(null);
      }
    } catch {
      toast({
        title: "Error",
        description: "Could not update item status.",
        variant: "destructive",
      });
    }
  };

  const confirmMarkSold = async () => {
    if (!sellingItem) return;
    const trimmed = salePriceInput.trim();
    const parsedPrice = trimmed ? Number(trimmed) : undefined;
    if (
      parsedPrice !== undefined &&
      (!Number.isFinite(parsedPrice) || parsedPrice < 0)
    ) {
      toast({
        title: "Invalid sale price",
        description: "Enter a valid non-negative number.",
        variant: "destructive",
      });
      return;
    }

    try {
      await setMovingStatus({
        id: sellingItem._id,
        movingStatus: "sold",
        salePrice: parsedPrice ?? null,
      });
      toast({
        title: "Marked as Sold & archived",
        description: `${sellingItem.name} has been moved to the Archived tab.`,
      });
      if (detailItemId === sellingItem._id) setDetailItemId(null);
      setSellingItem(null);
      setSalePriceInput("");
    } catch {
      toast({
        title: "Error",
        description: "Could not update item status.",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteItem({ id: deletingItem._id });
      toast({
        title: "Deleted",
        description: `${deletingItem.name} was removed from the catalog.`,
      });
      if (detailItemId === deletingItem._id) setDetailItemId(null);
      setDeletingItem(null);
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete catalog entry.",
        variant: "destructive",
      });
    }
  };

  const renderGrid = (list: CatalogItem[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {list.map((item) => (
        <CatalogItemCard
          key={item._id}
          item={item}
          onSelect={(i) => setDetailItemId(i._id)}
          onEdit={openEditDialog}
          onDelete={setDeletingItem}
          onStatusChange={handleStatusChange}
        />
      ))}
    </div>
  );

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 pb-24 md:pb-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Home Catalog
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track appliances, furniture, room measurements, purchase prices,
            manuals, and moving plans.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setIsFitCheckerOpen(true)}
          >
            <Ruler className="h-4 w-4" />
            Fit Checker
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={filteredItems.length === 0 || isExportingPdf}
            onClick={async () => {
              setIsExportingPdf(true);
              try {
                const { downloadCatalogPdf } = await import(
                  "@/services/export/catalogPdfService"
                );
                const propLabel =
                  addressFilter !== "all"
                    ? activeAddresses?.find((a) => a._id === addressFilter)
                        ?.name
                    : undefined;
                await downloadCatalogPdf(filteredItems, {
                  propertyLabel: propLabel,
                });
                toast({
                  title: "PDF exported",
                  description: `Downloaded moving & insurance pack (${filteredItems.length} entries).`,
                });
              } catch {
                toast({
                  title: "Export failed",
                  description: "Could not generate PDF pack.",
                  variant: "destructive",
                });
              } finally {
                setIsExportingPdf(false);
              }
            }}
          >
            {isExportingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            PDF Pack
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={filteredItems.length === 0}
            onClick={() => {
              exportCatalogToCsv(filteredItems);
              toast({
                title: "Exported CSV",
                description: `Downloaded ${filteredItems.length} catalog entr${filteredItems.length === 1 ? "y" : "ies"}.`,
              });
            }}
          >
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() =>
              openCreateDialog(activeTab === "spaces" ? "space" : "item")
            }
          >
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        </div>
      </div>

      {expiringWarranties.length > 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-start gap-2.5 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-200">
                {expiringWarranties.length} warrant
                {expiringWarranties.length === 1 ? "y" : "ies"} expiring within
                30 days
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {expiringWarranties.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => setDetailItemId(item._id)}
                    className="text-xs underline underline-offset-2 text-amber-800 dark:text-amber-300 hover:opacity-80"
                  >
                    {item.name} ({item.warrantyExpiryDate})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Active Items
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {summary.activeItemsCount}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {summary.archivedCount} archived (sold / donated / binned)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Insured / Purchase Value
            </CardTitle>
            <Wallet className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {formatCurrency(summary.totalActiveValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Active items only
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Measurements Logged
            </CardTitle>
            <Ruler className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {summary.withMeasurementsCount}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Incl. {summary.activeSpacesCount} space
              {summary.activeSpacesCount === 1 ? "" : "s"} / alcoves
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              With Manuals / Docs
            </CardTitle>
            <BookOpen className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {summary.withDocumentsCount}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Linked from Documents
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as CatalogTab);
            setStatusFilter("all");
          }}
        >
          <TabsList className="w-full sm:w-auto flex overflow-x-auto justify-start">
            <TabsTrigger value="active">
              All Active ({summary.activeItemsCount + summary.activeSpacesCount})
            </TabsTrigger>
            <TabsTrigger value="items">
              Items ({summary.activeItemsCount})
            </TabsTrigger>
            <TabsTrigger value="spaces">
              Spaces ({summary.activeSpacesCount})
            </TabsTrigger>
            <TabsTrigger value="moving" className="gap-1.5">
              <Truck className="h-3.5 w-3.5" />
              Moving Planner
            </TabsTrigger>
            <TabsTrigger value="archived" className="gap-1.5">
              <Archive className="h-3.5 w-3.5" />
              Archived ({summary.archivedCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, brand, model, room, retailer, or manual..."
              className="pl-9"
            />
          </div>

          <Select value={roomFilter} onValueChange={setRoomFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All Rooms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rooms</SelectItem>
              {uniqueRooms.map((room) => (
                <SelectItem key={room} value={room}>
                  {room}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeAddresses && activeAddresses.length > 0 && (
            <Select value={addressFilter} onValueChange={setAddressFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {activeAddresses.map((addr) => (
                  <SelectItem key={addr._id} value={addr._id}>
                    {addr.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {activeTab !== "moving" && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {MOVING_STATUS_OPTIONS.filter((opt) =>
                  activeTab === "archived" ? opt.isArchived : !opt.isArchived,
                ).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.shortLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {rawItems === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Skeleton key={n} className="h-36 rounded-lg" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              {activeTab === "archived" ? (
                <Archive className="h-6 w-6 text-muted-foreground" />
              ) : activeTab === "spaces" ? (
                <Ruler className="h-6 w-6 text-muted-foreground" />
              ) : (
                <Package className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">
                {activeTab === "archived"
                  ? "No archived items"
                  : searchTerm ||
                      roomFilter !== "all" ||
                      addressFilter !== "all"
                    ? "No matching catalog entries"
                    : "Start building your Home Catalog"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                {activeTab === "archived"
                  ? "Items marked as Sold, Donated, or Binned are automatically archived here."
                  : "Log appliances, furniture, window/alcove measurements, purchase prices, and manuals so everything is ready when you move."}
              </p>
            </div>
            {activeTab !== "archived" && (
              <div className="flex justify-center gap-2 pt-2">
                <Button size="sm" onClick={() => openCreateDialog("item")}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add Item / Appliance
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openCreateDialog("space")}
                >
                  <Ruler className="mr-1.5 h-4 w-4" />
                  Log Space Measurement
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : activeTab === "moving" ? (
        <div className="space-y-6">
          {ACTIVE_MOVING_STATUSES.map((statusKey) => {
            const group = filteredItems.filter(
              (item) => item.movingStatus === statusKey,
            );
            if (group.length === 0) return null;
            const meta = getMovingStatusMeta(statusKey);
            const groupValue = group.reduce(
              (sum, i) => sum + (i.purchasePrice ?? 0),
              0,
            );
            return (
              <section key={statusKey} className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`border-0 ${meta.badgeClass}`}>
                      {meta.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {group.length} entr{group.length === 1 ? "y" : "ies"}
                    </span>
                  </div>
                  {groupValue > 0 && (
                    <span className="text-xs font-medium text-muted-foreground tabular-nums">
                      Total value: {formatCurrency(groupValue)}
                    </span>
                  )}
                </div>
                {renderGrid(group)}
              </section>
            );
          })}
        </div>
      ) : (
        renderGrid(filteredItems)
      )}

      <CatalogItemDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open && initialPrefill) {
            setSearchParams({}, { replace: true });
          }
        }}
        editingItem={editingItem}
        defaultEntryType={defaultEntryType}
        prefillExpense={editingItem ? null : initialPrefill}
      />

      <FitCheckerDialog
        open={isFitCheckerOpen}
        onOpenChange={setIsFitCheckerOpen}
        items={items}
      />

      <CatalogItemDetailDialog
        item={detailItem}
        onOpenChange={(open) => {
          if (!open) {
            setDetailItemId(null);
            if (searchParams.get("item")) {
              const next = new URLSearchParams(searchParams);
              next.delete("item");
              setSearchParams(next, { replace: true });
            }
          }
        }}
        onEdit={openEditDialog}
        onDelete={setDeletingItem}
        onMarkStatus={handleStatusChange}
      />

      <Dialog
        open={Boolean(sellingItem)}
        onOpenChange={(open) => {
          if (!open) {
            setSellingItem(null);
            setSalePriceInput("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Sold & Archive</DialogTitle>
            <DialogDescription>
              {sellingItem?.name} will be tagged as Sold and moved to the
              Archived tab.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="quick-sale-price">Sold For (£, optional)</Label>
            <Input
              id="quick-sale-price"
              type="number"
              step="0.01"
              min="0"
              value={salePriceInput}
              onChange={(e) => setSalePriceInput(e.target.value)}
              placeholder="e.g. 95.00"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSellingItem(null);
                setSalePriceInput("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={confirmMarkSold}>Archive as Sold</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deletingItem)}
        onOpenChange={(open) => !open && setDeletingItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete catalog entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes &ldquo;{deletingItem?.name}&rdquo; and
              its uploaded photos. Any linked documents in Documents remain
              intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HomeCatalog;

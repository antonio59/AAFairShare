import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  checkItemFitsSpace,
  formatDimensions,
} from "../../../convex/utils/homeCatalog";
import { isItemArchived, type CatalogItem } from "./catalogConstants";
import { AlertTriangle, CheckCircle2, HelpCircle, Ruler } from "lucide-react";

interface FitCheckerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CatalogItem[];
  initialItemId?: string;
}

function hasAnyDimension(item: CatalogItem): boolean {
  return (
    item.width !== undefined ||
    item.depth !== undefined ||
    item.height !== undefined
  );
}

const FitCheckerDialog = ({
  open,
  onOpenChange,
  items,
  initialItemId,
}: FitCheckerDialogProps) => {
  const measurableItems = useMemo(
    () =>
      items.filter(
        (i) =>
          !isItemArchived(i) &&
          i.entryType !== "space" &&
          hasAnyDimension(i),
      ),
    [items],
  );

  const measurableSpaces = useMemo(
    () =>
      items.filter(
        (i) =>
          !isItemArchived(i) &&
          i.entryType === "space" &&
          hasAnyDimension(i),
      ),
    [items],
  );

  const [selectedItemId, setSelectedItemId] = useState<string>(
    () => initialItemId || measurableItems[0]?._id || "",
  );
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(
    () => measurableSpaces[0]?._id || "",
  );

  const resolvedItemId = measurableItems.some((i) => i._id === selectedItemId)
    ? selectedItemId
    : measurableItems[0]?._id || "";
  const resolvedSpaceId = measurableSpaces.some((s) => s._id === selectedSpaceId)
    ? selectedSpaceId
    : measurableSpaces[0]?._id || "";

  const selectedItem = measurableItems.find((i) => i._id === resolvedItemId);
  const selectedSpace = measurableSpaces.find((s) => s._id === resolvedSpaceId);

  const fitResult = useMemo(() => {
    if (!selectedItem || !selectedSpace) return null;
    return checkItemFitsSpace(selectedItem, selectedSpace);
  }, [selectedItem, selectedSpace]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary" />
            Will It Fit? Checker
          </DialogTitle>
          <DialogDescription>
            Compare any appliance or furniture item against a logged doorway,
            alcove, or room space. Units convert automatically.
          </DialogDescription>
        </DialogHeader>

        {measurableItems.length === 0 || measurableSpaces.length === 0 ? (
          <div className="rounded-lg border bg-muted/30 p-6 text-center space-y-2 text-sm">
            <p className="font-medium">
              {measurableItems.length === 0
                ? "No items with measurements yet"
                : "No spaces with measurements yet"}
            </p>
            <p className="text-muted-foreground text-xs">
              Log at least one Item (with W/D/H) and one Space / Measurement
              (e.g. a fridge alcove, doorway, or bay window) to compare clearances.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <Label>Item / Appliance</Label>
                <Select
                  value={resolvedItemId}
                  onValueChange={setSelectedItemId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose item" />
                  </SelectTrigger>
                  <SelectContent>
                    {measurableItems.map((item) => (
                      <SelectItem key={item._id} value={item._id}>
                        {item.name} ({formatDimensions(item)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Target Space / Opening</Label>
                <Select
                  value={resolvedSpaceId}
                  onValueChange={setSelectedSpaceId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose space" />
                  </SelectTrigger>
                  <SelectContent>
                    {measurableSpaces.map((space) => (
                      <SelectItem key={space._id} value={space._id}>
                        {space.name}
                        {space.addressName ? ` · ${space.addressName}` : ""} (
                        {formatDimensions(space)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {fitResult && (
              <div className="space-y-3 pt-1">
                <div
                  className={`rounded-lg border p-3.5 flex items-center gap-3 ${
                    fitResult.overallFits === true
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                      : fitResult.overallFits === false
                        ? "border-rose-500/40 bg-rose-500/10 text-rose-900 dark:text-rose-200"
                        : "border-border bg-muted/30 text-muted-foreground"
                  }`}
                >
                  {fitResult.overallFits === true ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  ) : fitResult.overallFits === false ? (
                    <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                  ) : (
                    <HelpCircle className="h-5 w-5 shrink-0" />
                  )}
                  <div className="text-sm">
                    <p className="font-semibold">
                      {fitResult.overallFits === true
                        ? "Fits with clearance!"
                        : fitResult.overallFits === false
                          ? "Does not fit as measured"
                          : "No overlapping axes measured"}
                    </p>
                    <p className="text-xs opacity-80">
                      Compared {fitResult.comparableAxes} axis
                      {fitResult.comparableAxes === 1 ? "" : "es"} in{" "}
                      {fitResult.unit}.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border divide-y">
                  {fitResult.axes.map((axis) => (
                    <div
                      key={axis.axis}
                      className="flex items-center justify-between px-3 py-2 text-xs gap-2"
                    >
                      <span className="font-medium w-14">{axis.label}</span>
                      <span className="text-muted-foreground tabular-nums flex-1">
                        Item:{" "}
                        <strong className="text-foreground">
                          {axis.itemValue !== null
                            ? `${axis.itemValue} ${fitResult.unit}`
                            : "—"}
                        </strong>{" "}
                        vs Space:{" "}
                        <strong className="text-foreground">
                          {axis.spaceValue !== null
                            ? `${axis.spaceValue} ${fitResult.unit}`
                            : "—"}
                        </strong>
                      </span>
                      {axis.fits === true && axis.clearance !== null ? (
                        <Badge className="border-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 tabular-nums">
                          +{axis.clearance} {fitResult.unit}
                        </Badge>
                      ) : axis.fits === false && axis.clearance !== null ? (
                        <Badge className="border-0 bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 tabular-nums">
                          {axis.clearance} {fitResult.unit}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          N/A
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>

                {(selectedItem?.measurementNotes ||
                  selectedSpace?.measurementNotes) && (
                  <div className="rounded-md bg-muted/40 p-2.5 text-xs space-y-1 text-muted-foreground">
                    {selectedItem?.measurementNotes && (
                      <p>
                        <strong className="text-foreground">Item note:</strong>{" "}
                        {selectedItem.measurementNotes}
                      </p>
                    )}
                    {selectedSpace?.measurementNotes && (
                      <p>
                        <strong className="text-foreground">Space note:</strong>{" "}
                        {selectedSpace.measurementNotes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FitCheckerDialog;

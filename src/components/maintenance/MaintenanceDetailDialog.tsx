import { useState } from "react";
import { format } from "date-fns";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/money";
import {
  useAddMaintenanceVisit,
  useRemoveMaintenanceVisit,
} from "@/hooks/useConvexData";
import {
  computeDaysOpen,
  type MaintenanceStatus,
  type VisitOutcome,
} from "../../../convex/utils/homeMaintenance";
import {
  getMaintenanceSeverityMeta,
  getMaintenanceStatusMeta,
  getVisitOutcomeMeta,
  MAINTENANCE_STATUS_OPTIONS,
  VISIT_OUTCOME_OPTIONS,
  type MaintenanceLog,
} from "./maintenanceConstants";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit,
  ExternalLink,
  FileDown,
  FileText,
  Home,
  Loader2,
  Package,
  Plus,
  Trash2,
  Wrench,
} from "lucide-react";

interface MaintenanceDetailDialogProps {
  log: MaintenanceLog | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (log: MaintenanceLog) => void;
  onDelete: (log: MaintenanceLog) => void;
  onQuickStatus: (log: MaintenanceLog, status: MaintenanceStatus) => void;
}

const MaintenanceDetailDialog = ({
  log,
  onOpenChange,
  onEdit,
  onDelete,
  onQuickStatus,
}: MaintenanceDetailDialogProps) => {
  const addVisit = useAddMaintenanceVisit();
  const removeVisit = useRemoveMaintenanceVisit();

  const [showAddVisit, setShowAddVisit] = useState(false);
  const [visitDate, setVisitDate] = useState(() =>
    format(new Date(), "yyyy-MM-dd"),
  );
  const [contractor, setContractor] = useState("");
  const [summary, setSummary] = useState("");
  const [outcome, setOutcome] = useState<VisitOutcome>("needs_followup");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [nextStatus, setNextStatus] = useState<string>("unchanged");
  const [isSavingVisit, setIsSavingVisit] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [enlargedPhotoUrl, setEnlargedPhotoUrl] = useState<string | null>(null);

  if (!log) return null;

  const statusMeta = getMaintenanceStatusMeta(log.status);
  const sevMeta = getMaintenanceSeverityMeta(log.severity);
  const days = computeDaysOpen(log.reportedDate, log.resolvedDate);

  const handleAddVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractor.trim() || !summary.trim()) {
      toast({
        title: "Missing details",
        description: "Enter who attended and a summary of what happened.",
        variant: "destructive",
      });
      return;
    }
    const parsedCost = cost.trim() ? Number(cost.trim()) : undefined;
    if (
      parsedCost !== undefined &&
      (!Number.isFinite(parsedCost) || parsedCost < 0)
    ) {
      toast({
        title: "Invalid cost",
        description: "Enter a non-negative amount.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingVisit(true);
    try {
      await addVisit({
        id: log._id,
        date: visitDate,
        contractor: contractor.trim(),
        summary: summary.trim(),
        outcome,
        cost: parsedCost,
        notes: notes.trim() || undefined,
        updateStatus: nextStatus !== "unchanged" ? nextStatus : undefined,
      });
      toast({
        title: "Visit logged",
        description: `Recorded visit by ${contractor.trim()}.`,
      });
      setContractor("");
      setSummary("");
      setCost("");
      setNotes("");
      setNextStatus("unchanged");
      setShowAddVisit(false);
    } catch {
      toast({
        title: "Error",
        description: "Failed to log visit.",
        variant: "destructive",
      });
    } finally {
      setIsSavingVisit(false);
    }
  };

  const handleExportSinglePdf = async () => {
    setIsExportingPdf(true);
    try {
      const { downloadMaintenanceReportPdf } = await import(
        "@/services/export/maintenancePdfService"
      );
      await downloadMaintenanceReportPdf([log], {
        propertyLabel: log.addressName ?? undefined,
        reportTitle: `Maintenance Issue Report - ${log.title}`,
      });
      toast({ title: "PDF exported", description: "Issue report downloaded." });
    } catch {
      toast({
        title: "Export failed",
        description: "Could not generate PDF.",
        variant: "destructive",
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <>
      <Dialog open={Boolean(log)} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="space-y-1.5 pr-6">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge className={`text-xs border-0 ${statusMeta.badgeClass}`}>
                  {statusMeta.label}
                </Badge>
                <Badge className={`text-xs border-0 ${sevMeta.badgeClass}`}>
                  {sevMeta.label} Priority
                </Badge>
                <Badge variant="outline" className="text-xs gap-1 tabular-nums">
                  <Clock className="h-3 w-3" />
                  {log.resolvedDate
                    ? `Resolved in ${days}d`
                    : `Open ${days}d`}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {log.room} · {log.category}
                </Badge>
              </div>
              <DialogTitle className="text-xl">{log.title}</DialogTitle>
              <DialogDescription className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                <span>Reported: {log.reportedDate}</span>
                {log.reportedTo && <span>To: {log.reportedTo}</span>}
                {log.referenceNumber && (
                  <span className="font-mono">Ref: {log.referenceNumber}</span>
                )}
                {log.addressName && (
                  <span className="inline-flex items-center gap-1">
                    <Home className="h-3 w-3" />
                    {log.addressName}
                  </span>
                )}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {log.linkedCatalogItem && (
              <div className="rounded-lg border bg-muted/30 px-3 py-2 flex items-center gap-2 text-xs">
                <Package className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <span className="font-medium text-foreground">
                    {log.linkedCatalogItem.name}
                  </span>
                  {(log.linkedCatalogItem.brand ||
                    log.linkedCatalogItem.modelNumber ||
                    log.linkedCatalogItem.serialNumber) && (
                    <span className="text-muted-foreground ml-1.5">
                      {[
                        log.linkedCatalogItem.brand,
                        log.linkedCatalogItem.modelNumber,
                        log.linkedCatalogItem.serialNumber,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                </div>
              </div>
            )}

            {log.description && (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Issue Description
                </h4>
                <p className="text-sm whitespace-pre-wrap">{log.description}</p>
              </div>
            )}

            {log.resolutionSummary && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-1">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  Final Outcome / Resolution
                </h4>
                <p className="text-sm">{log.resolutionSummary}</p>
              </div>
            )}

            {log.photos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {log.photos.map((photo) =>
                  photo.url ? (
                    <button
                      key={photo.storageId}
                      type="button"
                      onClick={() => setEnlargedPhotoUrl(photo.url)}
                      className="h-24 w-24 shrink-0 rounded-lg border overflow-hidden hover:opacity-90"
                    >
                      <img
                        src={photo.url}
                        alt="Evidence"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ) : null,
                )}
              </div>
            )}

            <Separator />

            {/* Engineer Visits & Outcomes Timeline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Wrench className="h-4 w-4 text-primary" />
                  Contractor Visits & Outcomes ({log.visits.length})
                </h4>
                <Button
                  type="button"
                  size="sm"
                  variant={showAddVisit ? "secondary" : "outline"}
                  className="h-8 gap-1 text-xs"
                  onClick={() => setShowAddVisit((v) => !v)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Log Visit / Update
                </Button>
              </div>

              {showAddVisit && (
                <form
                  onSubmit={handleAddVisit}
                  className="rounded-lg border bg-muted/30 p-3.5 space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label className="text-xs">Visit Date *</Label>
                      <Input
                        type="date"
                        value={visitDate}
                        onChange={(e) => setVisitDate(e.target.value)}
                        className="h-8 text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Who Attended (Contractor / Engineer / Landlord) *
                      </Label>
                      <Input
                        value={contractor}
                        onChange={(e) => setContractor(e.target.value)}
                        placeholder="e.g. ABC Plumbing (Dave)"
                        className="h-8 text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Outcome *</Label>
                      <Select
                        value={outcome}
                        onValueChange={(v) => {
                          const next = v as VisitOutcome;
                          setOutcome(next);
                          if (next === "fixed") setNextStatus("resolved");
                          if (next === "escalated") setNextStatus("escalated");
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VISIT_OUTCOME_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Cost (£, optional)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        placeholder="0.00"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">What They Did / Findings *</Label>
                    <textarea
                      rows={2}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Work carried out, parts needed, test result..."
                      className="flex w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label className="text-xs">Follow-up Notes</Label>
                      <Input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Next steps or promised date"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Update Issue Status</Label>
                      <Select value={nextStatus} onValueChange={setNextStatus}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unchanged">
                            Keep current ({statusMeta.label})
                          </SelectItem>
                          {MAINTENANCE_STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              Set to {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setShowAddVisit(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={isSavingVisit}
                    >
                      {isSavingVisit && (
                        <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                      )}
                      Save Visit
                    </Button>
                  </div>
                </form>
              )}

              {log.visits.length === 0 ? (
                <p className="text-xs text-muted-foreground rounded-lg border border-dashed p-4 text-center">
                  No visits or contractor updates logged yet. Click &ldquo;Log
                  Visit / Update&rdquo; whenever someone attends or inspects.
                </p>
              ) : (
                <div className="space-y-2">
                  {log.visits.map((visit) => {
                    const outMeta = getVisitOutcomeMeta(visit.outcome);
                    return (
                      <div
                        key={visit.id}
                        className="rounded-lg border p-3 space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-semibold tabular-nums">
                              {visit.date}
                            </span>
                            <span className="text-xs font-medium text-foreground">
                              · {visit.contractor}
                            </span>
                            <Badge
                              className={`text-[10px] border-0 ${outMeta.badgeClass}`}
                            >
                              {outMeta.label}
                            </Badge>
                            {visit.cost !== undefined && visit.cost > 0 && (
                              <Badge
                                variant="outline"
                                className="text-[10px] tabular-nums"
                              >
                                {formatCurrency(visit.cost)}
                              </Badge>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={async () => {
                              await removeVisit({
                                id: log._id,
                                visitId: visit.id,
                              });
                              toast({ title: "Visit removed" });
                            }}
                            aria-label="Remove visit"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-foreground/90">
                          {visit.summary}
                        </p>
                        {visit.notes && (
                          <p className="text-[11px] text-muted-foreground">
                            Follow-up: {visit.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {log.linkedDocuments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Linked Evidence & Documents
                </h4>
                <div className="space-y-1.5">
                  {log.linkedDocuments.map((doc) => (
                    <div
                      key={doc._id}
                      className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate font-medium">
                          {doc.title || doc.type}
                        </span>
                      </span>
                      {doc.url && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1 shrink-0"
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
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {log.status !== "resolved" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => onQuickStatus(log, "resolved")}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Mark Resolved
                  </Button>
                )}
                {log.status !== "escalated" && log.status !== "resolved" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => onQuickStatus(log, "escalated")}
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                    Escalate
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={isExportingPdf}
                  onClick={handleExportSinglePdf}
                >
                  {isExportingPdf ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileDown className="h-3.5 w-3.5" />
                  )}
                  Export PDF
                </Button>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive gap-1"
                  onClick={() => onDelete(log)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => onEdit(log)}
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(enlargedPhotoUrl)}
        onOpenChange={(open) => !open && setEnlargedPhotoUrl(null)}
      >
        <DialogContent className="max-w-3xl p-2">
          {enlargedPhotoUrl && (
            <img
              src={enlargedPhotoUrl}
              alt={log.title}
              className="w-full max-h-[80vh] object-contain rounded"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MaintenanceDetailDialog;

import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  useActiveAddresses,
  useDeleteMaintenanceLog,
  useHomeCatalogItems,
  useMaintenanceLogs,
  useSetMaintenanceStatus,
} from "@/hooks/useConvexData";
import {
  computeDaysOpen,
  computeMaintenanceSummary,
  type MaintenanceStatus,
} from "../../convex/utils/homeMaintenance";
import { type CatalogItem } from "@/components/catalog/catalogConstants";
import {
  exportMaintenanceToCsv,
  getMaintenanceSeverityMeta,
  getMaintenanceStatusMeta,
  getVisitOutcomeMeta,
  MAINTENANCE_CATEGORIES,
  MAINTENANCE_SEVERITY_OPTIONS,
  type MaintenanceLog,
} from "@/components/maintenance/maintenanceConstants";
import MaintenanceLogDialog from "@/components/maintenance/MaintenanceLogDialog";
import MaintenanceDetailDialog from "@/components/maintenance/MaintenanceDetailDialog";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileDown,
  Home,
  Loader2,
  Package,
  Plus,
  Search,
  Wrench,
} from "lucide-react";

type MaintenanceTab = "open" | "escalated" | "resolved" | "all";

const Maintenance = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawLogs = useMaintenanceLogs();
  const rawCatalogItems = useHomeCatalogItems();
  const activeAddresses = useActiveAddresses();
  const setStatus = useSetMaintenanceStatus();
  const deleteLog = useDeleteMaintenanceLog();

  const [activeTab, setActiveTab] = useState<MaintenanceTab>("open");
  const [searchTerm, setSearchTerm] = useState("");
  const [addressFilter, setAddressFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [isFormOpen, setIsFormOpen] = useState(
    () => Boolean(searchParams.get("catalogItemId")),
  );
  const [editingLog, setEditingLog] = useState<MaintenanceLog | null>(null);
  const [detailLogId, setDetailLogId] = useState<string | null>(null);
  const [deletingLog, setDeletingLog] = useState<MaintenanceLog | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const logs = useMemo<MaintenanceLog[]>(
    () => (rawLogs as MaintenanceLog[] | undefined) ?? [],
    [rawLogs],
  );

  const catalogItems = useMemo<CatalogItem[]>(
    () => (rawCatalogItems as CatalogItem[] | undefined) ?? [],
    [rawCatalogItems],
  );

  const paramCatalogItemId = searchParams.get("catalogItemId");
  const defaultCatalogItem = useMemo(
    () =>
      paramCatalogItemId
        ? catalogItems.find((i) => i._id === paramCatalogItemId) ?? null
        : null,
    [catalogItems, paramCatalogItemId],
  );

  const detailLog = useMemo(
    () => logs.find((l) => l._id === detailLogId) ?? null,
    [logs, detailLogId],
  );

  const summary = useMemo(() => computeMaintenanceSummary(logs), [logs]);

  const filteredLogs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return logs.filter((log) => {
      if (activeTab === "open" && log.status === "resolved") return false;
      if (activeTab === "escalated" && log.status !== "escalated") return false;
      if (activeTab === "resolved" && log.status !== "resolved") return false;

      if (addressFilter !== "all" && log.addressId !== addressFilter)
        return false;
      if (severityFilter !== "all" && log.severity !== severityFilter)
        return false;
      if (categoryFilter !== "all" && log.category !== categoryFilter)
        return false;

      if (!q) return true;
      return [
        log.title,
        log.room,
        log.category,
        log.reportedTo,
        log.referenceNumber,
        log.description,
        log.resolutionSummary,
        log.linkedCatalogItem?.name,
        ...log.visits.map((v) => `${v.contractor} ${v.summary}`),
      ].some((f) => f?.toLowerCase().includes(q));
    });
  }, [
    logs,
    activeTab,
    searchTerm,
    addressFilter,
    severityFilter,
    categoryFilter,
  ]);

  const selectedAddressLabel = useMemo(() => {
    if (addressFilter === "all") return undefined;
    return activeAddresses?.find((a) => a._id === addressFilter)?.name;
  }, [addressFilter, activeAddresses]);

  const handleQuickStatus = async (
    log: MaintenanceLog,
    status: MaintenanceStatus,
  ) => {
    try {
      await setStatus({ id: log._id, status });
      toast({
        title: `Marked as ${getMaintenanceStatusMeta(status).label}`,
        description: log.title,
      });
    } catch {
      toast({
        title: "Error",
        description: "Could not update status.",
        variant: "destructive",
      });
    }
  };

  const handleExportPdf = async () => {
    if (filteredLogs.length === 0) return;
    setIsExportingPdf(true);
    try {
      const { downloadMaintenanceReportPdf } = await import(
        "@/services/export/maintenancePdfService"
      );
      await downloadMaintenanceReportPdf(filteredLogs, {
        propertyLabel: selectedAddressLabel,
      });
      toast({
        title: "Report exported",
        description: `Downloaded PDF covering ${filteredLogs.length} issue${filteredLogs.length === 1 ? "" : "s"}.`,
      });
    } catch {
      toast({
        title: "Export failed",
        description: "Could not generate PDF report.",
        variant: "destructive",
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingLog) return;
    try {
      await deleteLog({ id: deletingLog._id });
      toast({ title: "Deleted", description: deletingLog.title });
      if (detailLogId === deletingLog._id) setDetailLogId(null);
      setDeletingLog(null);
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete log.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 pb-24 md:pb-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Issues & Maintenance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track household repairs, contractor visits, outcomes, and generate
            escalation or property handover reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={filteredLogs.length === 0 || isExportingPdf}
            onClick={handleExportPdf}
          >
            {isExportingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Export Report (PDF)
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={filteredLogs.length === 0}
            onClick={() => {
              exportMaintenanceToCsv(filteredLogs);
              toast({
                title: "CSV exported",
                description: `Downloaded ${filteredLogs.length} record${filteredLogs.length === 1 ? "" : "s"}.`,
              });
            }}
          >
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setEditingLog(null);
              if (paramCatalogItemId) {
                const next = new URLSearchParams(searchParams);
                next.delete("catalogItemId");
                setSearchParams(next, { replace: true });
              }
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Log Issue
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Open Issues
            </CardTitle>
            <Wrench className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {summary.openCount}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {summary.urgentOpenCount} high / urgent priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Escalated
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {summary.escalatedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Needs chase / formal follow-up
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Resolved
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {summary.resolvedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kept for handover history
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Contractor Visits
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {summary.totalVisits}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Logged across {summary.total} issue{summary.total === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs + Filters */}
      <div className="space-y-3">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as MaintenanceTab)}
        >
          <TabsList className="w-full sm:w-auto flex overflow-x-auto justify-start">
            <TabsTrigger value="open">Open ({summary.openCount})</TabsTrigger>
            <TabsTrigger value="escalated">
              Escalated ({summary.escalatedCount})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({summary.resolvedCount})
            </TabsTrigger>
            <TabsTrigger value="all">All ({summary.total})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search issue, contractor, ticket ref, appliance, or room..."
              className="pl-9"
            />
          </div>

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

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {MAINTENANCE_SEVERITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {MAINTENANCE_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      {rawLogs === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Wrench className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">No maintenance records found</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                Log repairs, contractor visits, outcomes, and ticket references
                so you have a complete paper trail for escalations or moving
                out.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingLog(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Log First Issue
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLogs.map((log) => {
            const statusMeta = getMaintenanceStatusMeta(log.status);
            const sevMeta = getMaintenanceSeverityMeta(log.severity);
            const days = computeDaysOpen(log.reportedDate, log.resolvedDate);
            const latestVisit = log.visits[log.visits.length - 1];

            return (
              <Card
                key={log._id}
                className="cursor-pointer transition-shadow hover:shadow-md flex flex-col justify-between"
                onClick={() => setDetailLogId(log._id)}
              >
                <div className="p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      className={`text-[11px] border-0 ${statusMeta.badgeClass}`}
                    >
                      {statusMeta.label}
                    </Badge>
                    <Badge
                      className={`text-[11px] border-0 ${sevMeta.badgeClass}`}
                    >
                      {sevMeta.label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[11px] gap-1 tabular-nums"
                    >
                      <Clock className="h-3 w-3" />
                      {log.resolvedDate ? `${days}d to resolve` : `Open ${days}d`}
                    </Badge>
                    {log.referenceNumber && (
                      <span className="text-[11px] font-mono text-muted-foreground ml-auto">
                        {log.referenceNumber}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-base leading-snug">
                      {log.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {log.room} · {log.category} · Reported {log.reportedDate}
                      {log.reportedTo ? ` to ${log.reportedTo}` : ""}
                    </p>
                  </div>

                  {log.description && (
                    <p className="text-xs text-foreground/80 line-clamp-2">
                      {log.description}
                    </p>
                  )}

                  {latestVisit && (
                    <div className="rounded-md bg-muted/50 px-2.5 py-1.5 text-xs space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">
                          Latest visit ({latestVisit.date}):{" "}
                          {latestVisit.contractor}
                        </span>
                        <Badge
                          className={`text-[10px] border-0 shrink-0 ${
                            getVisitOutcomeMeta(latestVisit.outcome).badgeClass
                          }`}
                        >
                          {getVisitOutcomeMeta(latestVisit.outcome).label}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground truncate">
                        {latestVisit.summary}
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t bg-muted/20 px-4 py-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0">
                      {log.visits.length} visit
                      {log.visits.length === 1 ? "" : "s"}
                    </span>
                    {log.linkedCatalogItem && (
                      <span className="inline-flex items-center gap-1 truncate text-foreground/80">
                        <Package className="h-3 w-3 shrink-0 text-primary" />
                        <span className="truncate">
                          {log.linkedCatalogItem.name}
                        </span>
                      </span>
                    )}
                  </div>
                  {log.addressName && (
                    <span className="inline-flex items-center gap-1 truncate max-w-[160px] shrink-0">
                      <Home className="h-3 w-3 shrink-0" />
                      <span className="truncate">{log.addressName}</span>
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <MaintenanceLogDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open && paramCatalogItemId) {
            const next = new URLSearchParams(searchParams);
            next.delete("catalogItemId");
            setSearchParams(next, { replace: true });
          }
        }}
        editingLog={editingLog}
        defaultCatalogItem={editingLog ? null : defaultCatalogItem}
      />

      <MaintenanceDetailDialog
        log={detailLog}
        onOpenChange={(open) => !open && setDetailLogId(null)}
        onEdit={(log) => {
          setDetailLogId(null);
          setEditingLog(log);
          setIsFormOpen(true);
        }}
        onDelete={setDeletingLog}
        onQuickStatus={handleQuickStatus}
      />

      <AlertDialog
        open={Boolean(deletingLog)}
        onOpenChange={(open) => !open && setDeletingLog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete maintenance record?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes &ldquo;{deletingLog?.title}&rdquo;, its
              visit history, and its evidence photos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Maintenance;

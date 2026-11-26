import { useEffect, useMemo, useRef, useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  useActiveAddresses,
  useAllDocuments,
  useCreateAddress,
  useCreateMaintenanceLog,
  useGenerateUploadUrl,
  useHomeCatalogItems,
  useUpdateMaintenanceLog,
} from "@/hooks/useConvexData";
import { DEMO_MODE } from "@/lib/demoData";
import {
  uploadFileToConvex,
  validateClientUploadFile,
} from "@/lib/storageUpload";
import { Id } from "../../../convex/_generated/dataModel";
import {
  type MaintenanceSeverity,
  type MaintenanceStatus,
} from "../../../convex/utils/homeMaintenance";
import { DEFAULT_ROOMS, type CatalogItem } from "@/components/catalog/catalogConstants";
import {
  MAINTENANCE_CATEGORIES,
  MAINTENANCE_SEVERITY_OPTIONS,
  MAINTENANCE_STATUS_OPTIONS,
  type MaintenanceLog,
} from "./maintenanceConstants";
import {
  Camera,
  Check,
  FileText,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react";

interface MaintenanceLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingLog?: MaintenanceLog | null;
  defaultCatalogItem?: CatalogItem | null;
}

interface PhotoPreview {
  storageId: Id<"_storage">;
  url: string | null;
  isObjectUrl?: boolean;
}

interface FormState {
  title: string;
  category: string;
  room: string;
  customRoom: string;
  addressId: string;
  catalogItemId: string;
  severity: MaintenanceSeverity;
  status: MaintenanceStatus;
  reportedDate: string;
  resolvedDate: string;
  reportedTo: string;
  referenceNumber: string;
  description: string;
  resolutionSummary: string;
  photos: PhotoPreview[];
  linkedDocumentIds: Id<"documents">[];
}

function buildInitialState(
  editingLog?: MaintenanceLog | null,
  defaultCatalogItem?: CatalogItem | null,
): FormState {
  if (editingLog) {
    const isPresetRoom = (DEFAULT_ROOMS as readonly string[]).includes(
      editingLog.room,
    );
    return {
      title: editingLog.title,
      category: editingLog.category,
      room: isPresetRoom ? editingLog.room : "Other",
      customRoom: isPresetRoom ? "" : editingLog.room,
      addressId: editingLog.addressId ?? "none",
      catalogItemId: editingLog.catalogItemId ?? "none",
      severity: (editingLog.severity as MaintenanceSeverity) || "medium",
      status: (editingLog.status as MaintenanceStatus) || "open",
      reportedDate: editingLog.reportedDate,
      resolvedDate: editingLog.resolvedDate ?? "",
      reportedTo: editingLog.reportedTo ?? "",
      referenceNumber: editingLog.referenceNumber ?? "",
      description: editingLog.description ?? "",
      resolutionSummary: editingLog.resolutionSummary ?? "",
      photos: editingLog.photos ?? [],
      linkedDocumentIds: editingLog.linkedDocumentIds ?? [],
    };
  }

  const defaultRoom = defaultCatalogItem?.room ?? "Living Room";
  const isPresetRoom = (DEFAULT_ROOMS as readonly string[]).includes(
    defaultRoom,
  );
  return {
    title: defaultCatalogItem ? `${defaultCatalogItem.name} — ` : "",
    category: defaultCatalogItem ? "Appliance Repair" : "Plumbing",
    room: isPresetRoom ? defaultRoom : "Other",
    customRoom: isPresetRoom ? "" : defaultRoom,
    addressId: defaultCatalogItem?.addressId ?? "none",
    catalogItemId: defaultCatalogItem?._id ?? "none",
    severity: "medium",
    status: "open",
    reportedDate: format(new Date(), "yyyy-MM-dd"),
    resolvedDate: "",
    reportedTo: "",
    referenceNumber: "",
    description: "",
    resolutionSummary: "",
    photos: [],
    linkedDocumentIds: [],
  };
}

const MaintenanceLogDialogContent = ({
  onOpenChange,
  editingLog,
  defaultCatalogItem,
}: Omit<MaintenanceLogDialogProps, "open">) => {
  const [form, setForm] = useState<FormState>(() =>
    buildInitialState(editingLog, defaultCatalogItem),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showDocPicker, setShowDocPicker] = useState(false);
  const [docSearch, setDocSearch] = useState("");
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddressName, setNewAddressName] = useState("");

  const photoInputRef = useRef<HTMLInputElement>(null);
  const createdObjectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const urls = createdObjectUrlsRef.current;
    return () => {
      for (const u of urls) URL.revokeObjectURL(u);
    };
  }, []);

  const activeAddresses = useActiveAddresses();
  const createAddress = useCreateAddress();
  const rawCatalogItems = useHomeCatalogItems();
  const allDocuments = useAllDocuments();
  const generateUploadUrl = useGenerateUploadUrl();
  const createLog = useCreateMaintenanceLog();
  const updateLog = useUpdateMaintenanceLog();

  const catalogItems = useMemo(
    () =>
      ((rawCatalogItems as CatalogItem[] | undefined) ?? []).filter(
        (i) => !i.isArchived && i.entryType !== "space",
      ),
    [rawCatalogItems],
  );

  const filteredDocs = useMemo(() => {
    const q = docSearch.trim().toLowerCase();
    return (allDocuments ?? []).filter(
      (d) =>
        !q ||
        d.title?.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q),
    );
  }, [allDocuments, docSearch]);

  const linkedDocsDetails = useMemo(() => {
    const docs = allDocuments ?? [];
    return form.linkedDocumentIds
      .map((id) => docs.find((d) => d._id === id))
      .filter((d): d is NonNullable<typeof d> => d !== undefined);
  }, [allDocuments, form.linkedDocumentIds]);

  const patchForm = (patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleAddProperty = async () => {
    const trimmed = newAddressName.trim();
    if (!trimmed) return;
    try {
      const id = await createAddress({ name: trimmed });
      patchForm({ addressId: id });
      setNewAddressName("");
      setShowNewAddress(false);
      toast({ title: "Property added", description: trimmed });
    } catch {
      toast({
        title: "Error",
        description: "Failed to add property.",
        variant: "destructive",
      });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (DEMO_MODE) return;
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = Math.max(0, 10 - form.photos.length);
    setIsUploadingPhoto(true);
    try {
      const uploaded: PhotoPreview[] = [];
      for (const file of files.slice(0, remaining)) {
        const validation = validateClientUploadFile(file, { allowPdf: false });
        if (!validation.valid) {
          toast({
            title: "Invalid photo",
            description: `${file.name}: ${validation.error}`,
            variant: "destructive",
          });
          continue;
        }
        const storageId = await uploadFileToConvex(file, generateUploadUrl);
        const previewUrl = URL.createObjectURL(file);
        createdObjectUrlsRef.current.push(previewUrl);
        uploaded.push({ storageId, url: previewUrl, isObjectUrl: true });
      }
      if (uploaded.length) {
        setForm((prev) => ({ ...prev, photos: [...prev.photos, ...uploaded] }));
      }
    } catch {
      toast({
        title: "Upload failed",
        description: "Could not upload evidence photo.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) {
      toast({
        title: "Title required",
        description: "Describe the issue or maintenance work.",
        variant: "destructive",
      });
      return;
    }

    const room =
      form.room === "Other" && form.customRoom.trim()
        ? form.customRoom.trim()
        : form.room;
    const addressId =
      form.addressId && form.addressId !== "none"
        ? (form.addressId as Id<"addresses">)
        : undefined;
    const catalogItemId =
      form.catalogItemId && form.catalogItemId !== "none"
        ? (form.catalogItemId as Id<"homeCatalogItems">)
        : undefined;
    const photoStorageIds = form.photos.map((p) => p.storageId);

    setIsSaving(true);
    try {
      if (editingLog) {
        await updateLog({
          id: editingLog._id,
          title,
          category: form.category,
          room,
          addressId: addressId ?? null,
          catalogItemId: catalogItemId ?? null,
          severity: form.severity,
          status: form.status,
          reportedDate: form.reportedDate,
          resolvedDate: form.resolvedDate || null,
          reportedTo: form.reportedTo,
          referenceNumber: form.referenceNumber,
          description: form.description,
          resolutionSummary: form.resolutionSummary,
          photoStorageIds,
          linkedDocumentIds: form.linkedDocumentIds,
        });
        toast({ title: "Maintenance log updated", description: title });
      } else {
        await createLog({
          title,
          category: form.category,
          room,
          addressId,
          catalogItemId,
          severity: form.severity,
          status: form.status,
          reportedDate: form.reportedDate,
          resolvedDate: form.resolvedDate || undefined,
          reportedTo: form.reportedTo || undefined,
          referenceNumber: form.referenceNumber || undefined,
          description: form.description || undefined,
          resolutionSummary: form.resolutionSummary || undefined,
          photoStorageIds,
          linkedDocumentIds: form.linkedDocumentIds,
        });
        toast({ title: "Issue / maintenance logged", description: title });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Save failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {editingLog
            ? "Edit Maintenance / Issue Log"
            : "Log Household Issue or Maintenance"}
        </DialogTitle>
        <DialogDescription>
          Record issues, contractor jobs, ticket numbers, and evidence photos
          for tracking, escalation, or property handover reports.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="maint-title">Issue / Work Title *</Label>
            <Input
              id="maint-title"
              value={form.title}
              onChange={(e) => patchForm({ title: e.target.value })}
              placeholder="e.g. Boiler losing pressure, Bathroom extractor fan leak"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(v) => patchForm({ category: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MAINTENANCE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Room / Area</Label>
            <Select
              value={form.room}
              onValueChange={(v) => patchForm({ room: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_ROOMS.map((room) => (
                  <SelectItem key={room} value={room}>
                    {room}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.room === "Other" && (
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="maint-custom-room">Custom Room / Area</Label>
              <Input
                id="maint-custom-room"
                value={form.customRoom}
                onChange={(e) => patchForm({ customRoom: e.target.value })}
                placeholder="e.g. Front Porch, Roof / Gutter"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Property / Address</Label>
              <button
                type="button"
                onClick={() => setShowNewAddress((v) => !v)}
                className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
              >
                <Plus className="h-3 w-3" />
                New Property
              </button>
            </div>
            <Select
              value={form.addressId}
              onValueChange={(v) => patchForm({ addressId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific property</SelectItem>
                {(activeAddresses ?? []).map((addr) => (
                  <SelectItem key={addr._id} value={addr._id}>
                    {addr.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {showNewAddress && (
              <div className="flex gap-1.5 pt-1">
                <Input
                  value={newAddressName}
                  onChange={(e) => setNewAddressName(e.target.value)}
                  placeholder="e.g. 14 Oak Road, London"
                  className="h-8 text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleAddProperty}
                >
                  Add
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Linked Appliance / Item (optional)</Label>
            <Select
              value={form.catalogItemId}
              onValueChange={(v) => patchForm({ catalogItemId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {catalogItems.map((item) => (
                  <SelectItem key={item._id} value={item._id}>
                    {item.name} ({item.room})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select
              value={form.severity}
              onValueChange={(v) =>
                patchForm({ severity: v as MaintenanceSeverity })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MAINTENANCE_SEVERITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                patchForm({ status: v as MaintenanceStatus })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MAINTENANCE_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="maint-reported-date">Reported Date *</Label>
            <Input
              id="maint-reported-date"
              type="date"
              value={form.reportedDate}
              onChange={(e) => patchForm({ reportedDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="maint-resolved-date">Resolved Date</Label>
            <Input
              id="maint-resolved-date"
              type="date"
              value={form.resolvedDate}
              onChange={(e) => patchForm({ resolvedDate: e.target.value })}
            />
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="maint-reported-to">
              Reported To (Landlord / Agent / Warranty)
            </Label>
            <Input
              id="maint-reported-to"
              value={form.reportedTo}
              onChange={(e) => patchForm({ reportedTo: e.target.value })}
              placeholder="e.g. Foxtons Property Management, British Gas"
            />
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="maint-ref">Case / Job Reference #</Label>
            <Input
              id="maint-ref"
              value={form.referenceNumber}
              onChange={(e) => patchForm({ referenceNumber: e.target.value })}
              placeholder="e.g. CASE-48219"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="maint-desc">Issue Details</Label>
          <textarea
            id="maint-desc"
            rows={3}
            value={form.description}
            onChange={(e) => patchForm({ description: e.target.value })}
            placeholder="Symptoms, impact, when it started, any communications sent..."
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        {(form.status === "resolved" || form.resolutionSummary) && (
          <div className="space-y-1.5">
            <Label htmlFor="maint-resolution">Final Outcome / Resolution</Label>
            <textarea
              id="maint-resolution"
              rows={2}
              value={form.resolutionSummary}
              onChange={(e) => patchForm({ resolutionSummary: e.target.value })}
              placeholder="How it was resolved and any guarantees..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        )}

        <Separator />

        {/* Evidence Photos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">
              Evidence Photos{" "}
              <span className="font-normal text-xs text-muted-foreground">
                (before/after, damage, meter/error codes)
              </span>
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              disabled={isUploadingPhoto || DEMO_MODE || form.photos.length >= 10}
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
              onChange={handlePhotoUpload}
              disabled={isUploadingPhoto || DEMO_MODE}
            />
          </div>
          {form.photos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.photos.map((photo) => (
                <div
                  key={photo.storageId}
                  className="relative h-16 w-16 rounded-lg border overflow-hidden bg-muted"
                >
                  {photo.url && (
                    <img
                      src={photo.url}
                      alt="Evidence"
                      className="h-full w-full object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (photo.isObjectUrl && photo.url) {
                        URL.revokeObjectURL(photo.url);
                      }
                      patchForm({
                        photos: form.photos.filter(
                          (p) => p.storageId !== photo.storageId,
                        ),
                      });
                    }}
                    className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                    aria-label="Remove photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Linked Documents */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">
              Linked Documents (certificates, quotes, emails)
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setShowDocPicker((v) => !v)}
            >
              <FileText className="h-3.5 w-3.5" />
              Link Documents
            </Button>
          </div>
          {linkedDocsDetails.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {linkedDocsDetails.map((doc) => (
                <Badge
                  key={doc._id}
                  variant="secondary"
                  className="gap-1.5 pr-1.5 text-xs"
                >
                  <span className="max-w-[180px] truncate">
                    {doc.title || doc.type}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      patchForm({
                        linkedDocumentIds: form.linkedDocumentIds.filter(
                          (id) => id !== doc._id,
                        ),
                      })
                    }
                    aria-label="Unlink document"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          {showDocPicker && (
            <div className="rounded-lg border p-2.5 space-y-2 bg-muted/20">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  placeholder="Search uploaded documents..."
                  className="pl-8 h-8 text-xs"
                />
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1">
                {filteredDocs.map((doc) => {
                  const selected = form.linkedDocumentIds.includes(doc._id);
                  return (
                    <button
                      key={doc._id}
                      type="button"
                      onClick={() =>
                        patchForm({
                          linkedDocumentIds: selected
                            ? form.linkedDocumentIds.filter((i) => i !== doc._id)
                            : [...form.linkedDocumentIds, doc._id],
                        })
                      }
                      className={`w-full flex items-center justify-between rounded px-2 py-1 text-left text-xs ${
                        selected ? "bg-primary/10 text-primary" : "hover:bg-accent"
                      }`}
                    >
                      <span className="truncate">
                        [{doc.type}] {doc.title || "Untitled"} ({doc.date})
                      </span>
                      {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingLog ? "Save Changes" : "Log Issue"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

const MaintenanceLogDialog = ({
  open,
  onOpenChange,
  editingLog,
  defaultCatalogItem,
}: MaintenanceLogDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    {open && (
      <MaintenanceLogDialogContent
        key={editingLog?._id ?? defaultCatalogItem?._id ?? "new-maint"}
        onOpenChange={onOpenChange}
        editingLog={editingLog}
        defaultCatalogItem={defaultCatalogItem}
      />
    )}
  </Dialog>
);

export default MaintenanceLogDialog;

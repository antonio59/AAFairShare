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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthContext";
import {
  useActiveAddresses,
  useAllDocuments,
  useCreateAddress,
  useCreateDocument,
  useCreateHomeCatalogItem,
  useExpensesForLinking,
  useGenerateUploadUrl,
  useUpdateHomeCatalogItem,
} from "@/hooks/useConvexData";
import { DEMO_MODE } from "@/lib/demoData";
import { formatCurrency } from "@/lib/money";
import {
  uploadFileToConvex,
  validateClientUploadFile,
} from "@/lib/storageUpload";
import { Id } from "../../../convex/_generated/dataModel";
import {
  isArchivedMovingStatus,
  type CatalogEntryType,
  type DimensionUnit,
  type MovingStatus,
  type WeightUnit,
} from "../../../convex/utils/homeCatalog";
import {
  DEFAULT_ROOMS,
  ITEM_CATEGORIES,
  MOVING_STATUS_OPTIONS,
  SPACE_CATEGORIES,
  type CatalogItem,
} from "./catalogConstants";
import {
  CatalogDocumentsSection,
  CatalogMeasurementsSection,
  CatalogPhotosSection,
  CatalogPurchaseSection,
  type LinkableExpense,
  type PhotoPreview,
} from "./CatalogFormSections";
import { Loader2, Package, Plus, Ruler } from "lucide-react";

export interface CatalogExpensePrefill {
  id: Id<"expenses">;
  amount: number;
  date: string;
  description: string;
  location: string;
}

interface CatalogItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem?: CatalogItem | null;
  defaultEntryType?: CatalogEntryType;
  prefillExpense?: CatalogExpensePrefill | null;
}

interface FormState {
  entryType: CatalogEntryType;
  name: string;
  category: string;
  room: string;
  customRoom: string;
  addressId: string;
  brand: string;
  modelNumber: string;
  serialNumber: string;
  width: string;
  depth: string;
  height: string;
  dimensionUnit: DimensionUnit;
  weight: string;
  weightUnit: WeightUnit;
  measurementNotes: string;
  purchasePrice: string;
  purchaseDate: string;
  retailer: string;
  warrantyExpiryDate: string;
  linkedExpenseId: Id<"expenses"> | null;
  linkedExpenseLabel: string;
  linkedDocumentIds: Id<"documents">[];
  photos: PhotoPreview[];
  movingStatus: MovingStatus;
  salePrice: string;
  notes: string;
}

function buildInitialState(
  editingItem: CatalogItem | null | undefined,
  defaultEntryType: CatalogEntryType,
  prefillExpense?: CatalogExpensePrefill | null,
): FormState {
  if (!editingItem) {
    return {
      entryType: prefillExpense ? "item" : defaultEntryType,
      name: prefillExpense?.description ?? "",
      category:
        !prefillExpense && defaultEntryType === "space"
          ? "Window / Curtain"
          : "Appliance",
      room: "Living Room",
      customRoom: "",
      addressId: "none",
      brand: "",
      modelNumber: "",
      serialNumber: "",
      width: "",
      depth: "",
      height: "",
      dimensionUnit: "cm",
      weight: "",
      weightUnit: "kg",
      measurementNotes: "",
      purchasePrice: prefillExpense ? String(prefillExpense.amount) : "",
      purchaseDate: prefillExpense?.date ?? "",
      retailer:
        prefillExpense && prefillExpense.location !== "Unknown"
          ? prefillExpense.location
          : "",
      warrantyExpiryDate: "",
      linkedExpenseId: prefillExpense?.id ?? null,
      linkedExpenseLabel: prefillExpense
        ? `${prefillExpense.description || prefillExpense.location} · ${formatCurrency(prefillExpense.amount)} (${prefillExpense.date})`
        : "",
      linkedDocumentIds: [],
      photos: [],
      movingStatus:
        !prefillExpense && defaultEntryType === "space" ? "stays" : "keeping",
      salePrice: "",
      notes: "",
    };
  }

  const isPresetRoom = (DEFAULT_ROOMS as readonly string[]).includes(
    editingItem.room,
  );
  const exp = editingItem.linkedExpense;
  return {
    entryType: editingItem.entryType === "space" ? "space" : "item",
    name: editingItem.name,
    category: editingItem.category,
    room: isPresetRoom ? editingItem.room : "Other",
    customRoom: isPresetRoom ? "" : editingItem.room,
    addressId: editingItem.addressId ?? "none",
    brand: editingItem.brand ?? "",
    modelNumber: editingItem.modelNumber ?? "",
    serialNumber: editingItem.serialNumber ?? "",
    width: editingItem.width !== undefined ? String(editingItem.width) : "",
    depth: editingItem.depth !== undefined ? String(editingItem.depth) : "",
    height: editingItem.height !== undefined ? String(editingItem.height) : "",
    dimensionUnit: (editingItem.dimensionUnit as DimensionUnit) || "cm",
    weight: editingItem.weight !== undefined ? String(editingItem.weight) : "",
    weightUnit: (editingItem.weightUnit as WeightUnit) || "kg",
    measurementNotes: editingItem.measurementNotes ?? "",
    purchasePrice:
      editingItem.purchasePrice !== undefined
        ? String(editingItem.purchasePrice)
        : "",
    purchaseDate: editingItem.purchaseDate ?? "",
    retailer: editingItem.retailer ?? "",
    warrantyExpiryDate: editingItem.warrantyExpiryDate ?? "",
    linkedExpenseId: editingItem.linkedExpenseId ?? null,
    linkedExpenseLabel: exp
      ? `${exp.description || exp.location} · ${formatCurrency(exp.amount)} (${exp.date})`
      : "",
    linkedDocumentIds: editingItem.linkedDocumentIds ?? [],
    photos: editingItem.photos ?? [],
    movingStatus: (editingItem.movingStatus as MovingStatus) || "keeping",
    salePrice:
      editingItem.salePrice !== undefined ? String(editingItem.salePrice) : "",
    notes: editingItem.notes ?? "",
  };
}

function parseOptionalNumber(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

interface ParsedNumericFields {
  width?: number;
  depth?: number;
  height?: number;
  weight?: number;
  purchasePrice?: number;
  salePrice?: number;
}

function validateCatalogForm(
  form: FormState,
): { error: string } | { name: string; room: string; numbers: ParsedNumericFields } {
  const name = form.name.trim();
  if (!name) return { error: "Enter a name for this item or space." };

  const room =
    form.room === "Other" && form.customRoom.trim()
      ? form.customRoom.trim()
      : form.room;

  const numbers: ParsedNumericFields = {
    width: parseOptionalNumber(form.width),
    depth: parseOptionalNumber(form.depth),
    height: parseOptionalNumber(form.height),
    weight: parseOptionalNumber(form.weight),
    purchasePrice: parseOptionalNumber(form.purchasePrice),
    salePrice: parseOptionalNumber(form.salePrice),
  };

  for (const [label, val] of [
    ["Width", numbers.width],
    ["Depth", numbers.depth],
    ["Height", numbers.height],
    ["Weight", numbers.weight],
  ] as const) {
    if (val !== undefined && val <= 0) {
      return { error: `${label} must be greater than 0.` };
    }
  }

  if (numbers.purchasePrice !== undefined && numbers.purchasePrice < 0) {
    return { error: "Purchase price cannot be negative." };
  }
  if (numbers.salePrice !== undefined && numbers.salePrice < 0) {
    return { error: "Sale price cannot be negative." };
  }

  return { name, room, numbers };
}

const DOC_TYPE_PRIORITY: Record<string, number> = {
  manual: 0,
  warranty: 1,
  receipt: 2,
  insurance: 3,
  certificate: 4,
  invoice: 5,
  bill: 6,
  other: 7,
};

const CatalogItemDialogContent = ({
  onOpenChange,
  editingItem,
  defaultEntryType = "item",
  prefillExpense,
}: Omit<CatalogItemDialogProps, "open">) => {
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(() =>
    buildInitialState(editingItem, defaultEntryType, prefillExpense),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingManual, setIsUploadingManual] = useState(false);
  const [showExpensePicker, setShowExpensePicker] = useState(false);
  const [expenseSearch, setExpenseSearch] = useState("");
  const [docSearch, setDocSearch] = useState("");
  const [showDocPicker, setShowDocPicker] = useState(false);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddressName, setNewAddressName] = useState("");

  const photoInputRef = useRef<HTMLInputElement>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const createdObjectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const createdUrls = createdObjectUrlsRef.current;
    return () => {
      for (const url of createdUrls) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  const activeAddresses = useActiveAddresses();
  const createAddress = useCreateAddress();
  const allDocuments = useAllDocuments();
  const generateUploadUrl = useGenerateUploadUrl();
  const createDocument = useCreateDocument();
  const createItem = useCreateHomeCatalogItem();
  const updateItem = useUpdateHomeCatalogItem();
  const expensesForLinking = useExpensesForLinking(
    expenseSearch,
    showExpensePicker,
  );

  const categories =
    form.entryType === "space" ? SPACE_CATEGORIES : ITEM_CATEGORIES;

  const sortedDocuments = useMemo(() => {
    const docs = allDocuments ?? [];
    const q = docSearch.trim().toLowerCase();
    return [...docs]
      .filter((doc) => {
        if (!q) return true;
        return (
          doc.title?.toLowerCase().includes(q) ||
          doc.type.toLowerCase().includes(q) ||
          doc.notes?.toLowerCase().includes(q)
        );
      })
      .sort(
        (a, b) =>
          (DOC_TYPE_PRIORITY[a.type] ?? 9) - (DOC_TYPE_PRIORITY[b.type] ?? 9),
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

  const handleEntryTypeChange = (nextType: CatalogEntryType) => {
    const nextCategories =
      nextType === "space" ? SPACE_CATEGORIES : ITEM_CATEGORIES;
    const categoryValid = (nextCategories as readonly string[]).includes(
      form.category,
    );
    const nextMovingStatus = editingItem
      ? form.movingStatus
      : nextType === "space" && form.movingStatus === "keeping"
        ? "stays"
        : nextType === "item" && form.movingStatus === "stays"
          ? "keeping"
          : form.movingStatus;

    patchForm({
      entryType: nextType,
      category: categoryValid ? form.category : nextCategories[0],
      movingStatus: nextMovingStatus,
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (DEMO_MODE) return;
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remainingSlots = Math.max(0, 10 - form.photos.length);
    const toUpload = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      toast({
        title: "Photo limit",
        description: "Up to 10 photos can be attached per entry.",
      });
    }

    setIsUploadingPhoto(true);
    try {
      const uploaded: PhotoPreview[] = [];
      for (const file of toUpload) {
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
        toast({
          title: "Photo uploaded",
          description: `Added ${uploaded.length} photo${uploaded.length > 1 ? "s" : ""}.`,
        });
      }
    } catch {
      toast({
        title: "Upload failed",
        description: "Could not upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = (photo: PhotoPreview) => {
    if (photo.isObjectUrl && photo.url) {
      URL.revokeObjectURL(photo.url);
    }
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((ph) => ph.storageId !== photo.storageId),
    }));
  };

  const handleQuickUploadManual = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (DEMO_MODE) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateClientUploadFile(file, { allowPdf: true });
    if (!validation.valid || !validation.fileType) {
      toast({
        title: "Invalid file",
        description: validation.error || "Please upload a PDF or image manual.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingManual(true);
    try {
      const storageId = await uploadFileToConvex(file, generateUploadUrl);
      const fallbackName = file.name.replace(/\.[^.]+$/, "");
      const title = form.name.trim()
        ? `${form.name.trim()} Manual`
        : fallbackName;

      const docId = await createDocument({
        storageId,
        type: "manual",
        title,
        date: form.purchaseDate || format(new Date(), "yyyy-MM-dd"),
        fileType: validation.fileType,
        uploadedBy: user?.id ? (user.id as Id<"users">) : undefined,
        notes: form.modelNumber ? `Model: ${form.modelNumber}` : undefined,
        tags: ["manual", form.room.toLowerCase()],
      });

      setForm((prev) => ({
        ...prev,
        linkedDocumentIds: prev.linkedDocumentIds.includes(docId)
          ? prev.linkedDocumentIds
          : [...prev.linkedDocumentIds, docId],
      }));

      toast({
        title: "Manual uploaded & linked",
        description: `"${title}" saved to Documents and linked to this entry.`,
      });
    } catch {
      toast({
        title: "Upload failed",
        description: "Could not upload manual. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingManual(false);
      if (manualInputRef.current) manualInputRef.current.value = "";
    }
  };

  const toggleLinkedDocument = (docId: Id<"documents">) => {
    setForm((prev) => ({
      ...prev,
      linkedDocumentIds: prev.linkedDocumentIds.includes(docId)
        ? prev.linkedDocumentIds.filter((id) => id !== docId)
        : [...prev.linkedDocumentIds, docId],
    }));
  };

  const handleLinkExpense = (expense: LinkableExpense) => {
    patchForm({
      linkedExpenseId: expense._id,
      linkedExpenseLabel: `${expense.description || expense.location} · ${formatCurrency(expense.amount)} (${expense.date})`,
      purchasePrice: String(expense.amount),
      purchaseDate: expense.date,
      retailer:
        expense.location && expense.location !== "Unknown"
          ? expense.location
          : form.retailer,
    });
    setShowExpensePicker(false);
    toast({
      title: "Expense linked",
      description: "Purchase price, date, and retailer filled from expense.",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateCatalogForm(form);
    if ("error" in validation) {
      toast({
        title: "Check form fields",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    const { name, room, numbers } = validation;
    const addressId =
      form.addressId && form.addressId !== "none"
        ? (form.addressId as Id<"addresses">)
        : undefined;
    const photoStorageIds = form.photos.map((p) => p.storageId);
    const archived = isArchivedMovingStatus(form.movingStatus);

    setIsSaving(true);
    try {
      if (editingItem) {
        await updateItem({
          id: editingItem._id,
          entryType: form.entryType,
          name,
          category: form.category,
          room,
          addressId: addressId ?? null,
          brand: form.brand,
          modelNumber: form.modelNumber,
          serialNumber: form.serialNumber,
          width: numbers.width ?? null,
          depth: numbers.depth ?? null,
          height: numbers.height ?? null,
          dimensionUnit: form.dimensionUnit,
          weight: numbers.weight ?? null,
          weightUnit: form.weightUnit,
          measurementNotes: form.measurementNotes,
          purchasePrice: numbers.purchasePrice ?? null,
          purchaseDate: form.purchaseDate || null,
          retailer: form.retailer,
          warrantyExpiryDate: form.warrantyExpiryDate || null,
          linkedExpenseId: form.linkedExpenseId ?? null,
          photoStorageIds,
          linkedDocumentIds: form.linkedDocumentIds,
          movingStatus: form.movingStatus,
          salePrice: numbers.salePrice ?? null,
          notes: form.notes,
        });
      } else {
        await createItem({
          entryType: form.entryType,
          name,
          category: form.category,
          room,
          addressId,
          brand: form.brand || undefined,
          modelNumber: form.modelNumber || undefined,
          serialNumber: form.serialNumber || undefined,
          width: numbers.width,
          depth: numbers.depth,
          height: numbers.height,
          dimensionUnit: form.dimensionUnit,
          weight: numbers.weight,
          weightUnit: form.weightUnit,
          measurementNotes: form.measurementNotes || undefined,
          purchasePrice: numbers.purchasePrice,
          purchaseDate: form.purchaseDate || undefined,
          retailer: form.retailer || undefined,
          warrantyExpiryDate: form.warrantyExpiryDate || undefined,
          linkedExpenseId: form.linkedExpenseId ?? undefined,
          photoStorageIds,
          linkedDocumentIds: form.linkedDocumentIds,
          movingStatus: form.movingStatus,
          salePrice: numbers.salePrice,
          notes: form.notes || undefined,
        });
      }

      toast({
        title: archived
          ? editingItem
            ? "Updated & archived"
            : "Added to Archive"
          : editingItem
            ? "Catalog entry updated"
            : "Added to Home Catalog",
        description: archived
          ? `${name} was moved to the Archived tab.`
          : `${name} has been saved.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error saving entry",
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
          {editingItem ? "Edit Catalog Entry" : "Add to Home Catalog"}
        </DialogTitle>
        <DialogDescription>
          Log appliances, furniture, room/space measurements, purchase details,
          and linked manuals.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleEntryTypeChange("item")}
            className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
              form.entryType === "item"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <Package className="h-4 w-4" />
            Item / Appliance
          </button>
          <button
            type="button"
            onClick={() => handleEntryTypeChange("space")}
            className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
              form.entryType === "space"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <Ruler className="h-4 w-4" />
            Space / Measurement
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="catalog-name">Name *</Label>
            <Input
              id="catalog-name"
              value={form.name}
              onChange={(e) => patchForm({ name: e.target.value })}
              placeholder={
                form.entryType === "space"
                  ? "e.g. Living Room Bay Window, Fridge Alcove"
                  : "e.g. Samsung EcoBubble Washing Machine, IKEA Sofa"
              }
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
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Room</Label>
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
              <Label htmlFor="catalog-custom-room">Custom Room Name</Label>
              <Input
                id="catalog-custom-room"
                value={form.customRoom}
                onChange={(e) => patchForm({ customRoom: e.target.value })}
                placeholder="e.g. Conservatory, Guest WC"
              />
            </div>
          )}

          <div className="sm:col-span-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Property / Address (optional)</Label>
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
                  onClick={async () => {
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
                        description: "Could not add property.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            )}
          </div>
        </div>

        {form.entryType === "item" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="catalog-brand">Brand</Label>
              <Input
                id="catalog-brand"
                value={form.brand}
                onChange={(e) => patchForm({ brand: e.target.value })}
                placeholder="e.g. Bosch, IKEA"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="catalog-model">Model Number</Label>
              <Input
                id="catalog-model"
                value={form.modelNumber}
                onChange={(e) => patchForm({ modelNumber: e.target.value })}
                placeholder="e.g. WW90T534DAN"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="catalog-serial">Serial Number</Label>
              <Input
                id="catalog-serial"
                value={form.serialNumber}
                onChange={(e) => patchForm({ serialNumber: e.target.value })}
                placeholder="For warranty / parts"
              />
            </div>
          </div>
        )}

        <Separator />

        <CatalogMeasurementsSection
          entryType={form.entryType}
          width={form.width}
          depth={form.depth}
          height={form.height}
          dimensionUnit={form.dimensionUnit}
          weight={form.weight}
          weightUnit={form.weightUnit}
          measurementNotes={form.measurementNotes}
          onChange={patchForm}
        />

        {form.entryType === "item" && (
          <>
            <Separator />
            <CatalogPurchaseSection
              purchasePrice={form.purchasePrice}
              purchaseDate={form.purchaseDate}
              retailer={form.retailer}
              warrantyExpiryDate={form.warrantyExpiryDate}
              linkedExpenseId={form.linkedExpenseId}
              linkedExpenseLabel={form.linkedExpenseLabel}
              showExpensePicker={showExpensePicker}
              expenseSearch={expenseSearch}
              expensesForLinking={expensesForLinking}
              onToggleExpensePicker={() => setShowExpensePicker((v) => !v)}
              onExpenseSearchChange={setExpenseSearch}
              onSelectExpense={handleLinkExpense}
              onUnlinkExpense={() =>
                patchForm({ linkedExpenseId: null, linkedExpenseLabel: "" })
              }
              onChange={patchForm}
            />
          </>
        )}

        <Separator />

        <CatalogPhotosSection
          photos={form.photos}
          isUploadingPhoto={isUploadingPhoto}
          photoInputRef={photoInputRef}
          onUploadPhoto={handlePhotoUpload}
          onRemovePhoto={handleRemovePhoto}
        />

        <Separator />

        <CatalogDocumentsSection
          linkedDocumentIds={form.linkedDocumentIds}
          linkedDocsDetails={linkedDocsDetails}
          sortedDocuments={sortedDocuments}
          showDocPicker={showDocPicker}
          docSearch={docSearch}
          isUploadingManual={isUploadingManual}
          manualInputRef={manualInputRef}
          onToggleDocPicker={() => setShowDocPicker((v) => !v)}
          onDocSearchChange={setDocSearch}
          onToggleDocument={toggleLinkedDocument}
          onQuickUploadManual={handleQuickUploadManual}
        />

        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Moving / Disposition Status</Label>
            <Select
              value={form.movingStatus}
              onValueChange={(v) =>
                patchForm({ movingStatus: v as MovingStatus })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOVING_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isArchivedMovingStatus(form.movingStatus) && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Tagging as sold, donated, or binned automatically archives this
                item.
              </p>
            )}
          </div>

          {(form.movingStatus === "sold" ||
            form.movingStatus === "plan_sell") && (
            <div className="space-y-1.5">
              <Label htmlFor="catalog-sale-price">
                {form.movingStatus === "sold"
                  ? "Sold For (£)"
                  : "Target Resale Price (£)"}
              </Label>
              <Input
                id="catalog-sale-price"
                type="number"
                step="0.01"
                min="0"
                value={form.salePrice}
                onChange={(e) => patchForm({ salePrice: e.target.value })}
                placeholder="Optional"
              />
            </div>
          )}

          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="catalog-notes">Notes</Label>
            <textarea
              id="catalog-notes"
              rows={2}
              value={form.notes}
              onChange={(e) => patchForm({ notes: e.target.value })}
              placeholder="Care tips, spare parts, moving box notes..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
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
            {editingItem ? "Save Changes" : "Add to Catalog"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

const CatalogItemDialog = ({
  open,
  onOpenChange,
  editingItem,
  defaultEntryType = "item",
  prefillExpense,
}: CatalogItemDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <CatalogItemDialogContent
          key={
            editingItem?._id ??
            prefillExpense?.id ??
            `new-${defaultEntryType}`
          }
          onOpenChange={onOpenChange}
          editingItem={editingItem}
          defaultEntryType={defaultEntryType}
          prefillExpense={prefillExpense}
        />
      )}
    </Dialog>
  );
};

export default CatalogItemDialog;

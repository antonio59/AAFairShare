import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthContext";
import {
  useActiveAddresses,
  useCreateAddress,
  useAllDocuments,
  useDocumentsByAddress,
  useDocumentsByType,
  useGenerateUploadUrl,
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
  useDocumentById,
  useExpiringDocuments,
  useSearchDocuments,
  useBulkDeleteDocuments,
  useExpensesByMonth,
  useLinkDocumentToExpense,
} from "@/hooks/useConvexData";
import { Id } from "../../convex/_generated/dataModel";
import { DEMO_MODE } from "@/lib/demoData";
import { useOcr } from "@/hooks/useOcr";
import { format } from "date-fns";
import {
  Home,
  Plus,
  Upload,
  FileText,
  Image,
  Download,
  Edit,
  Trash2,
  Search,
  Eye,
  X,
  Loader2,
  Receipt,
  Camera,
  Tag,
  AlertTriangle,
  Link2,
  CheckSquare,
  Square,
  History,
} from "lucide-react";

const DOCUMENT_TYPE_OPTIONS = [
  { value: "all", label: "All Documents" },
  { value: "bill", label: "Bills" },
  { value: "receipt", label: "Receipts" },
  { value: "warranty", label: "Warranties" },
  { value: "insurance", label: "Insurance" },
  { value: "certificate", label: "Certificates" },
  { value: "invoice", label: "Invoices" },
  { value: "other", label: "Other" },
];

const BILL_TYPES = [
  { value: "council-tax", label: "Council Tax" },
  { value: "electricity", label: "Electricity" },
  { value: "gas", label: "Gas" },
  { value: "water", label: "Water" },
  { value: "internet", label: "Internet" },
  { value: "insurance", label: "Insurance" },
  { value: "tv-license", label: "TV License" },
  { value: "service-charge", label: "Service Charge" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other" },
];

const TYPE_ICONS: Record<string, string> = {
  bill: "📄",
  receipt: "🧾",
  warranty: "🛡️",
  insurance: "🛡️",
  certificate: "📜",
  invoice: "📋",
  other: "📎",
};

const TYPE_COLORS: Record<string, string> = {
  bill: "bg-blue-100 text-blue-800",
  receipt: "bg-green-100 text-green-800",
  warranty: "bg-purple-100 text-purple-800",
  insurance: "bg-amber-100 text-amber-800",
  certificate: "bg-teal-100 text-teal-800",
  invoice: "bg-orange-100 text-orange-800",
  other: "bg-gray-100 text-gray-800",
};

interface DocumentItem {
  _id: Id<"documents">;
  storageId: Id<"_storage">;
  type: string;
  title?: string;
  filename?: string;
  amount?: number;
  date: string;
  notes?: string;
  fileType: string;
  url: string;
  billType?: string;
  monthlyAmount?: number;
  billPeriod?: string;
  expiryDate?: string;
  addressId?: Id<"addresses">;
  linkedExpenseCount: number;
  tags?: string[];
  versionHistory?: Record<string, string>[];
}

const Documents = () => {
  const { user } = useAuth();

  // Filters
  const [selectedType, setSelectedType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAddressId, setSelectedAddressId] =
    useState<Id<"addresses"> | null>(null);

  // Upload state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadData, setUploadData] = useState({
    storageId: null as Id<"_storage"> | null,
    type: "receipt",
    title: "",
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
    fileType: "",
    // Bill-specific
    addressId: "" as string,
    billType: "",
    monthlyAmount: "",
    billPeriod: "",
    // Expiry
    expiryDate: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // View/Edit state
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    title: "",
    amount: "",
    notes: "",
    billType: "",
    monthlyAmount: "",
    billPeriod: "",
    expiryDate: "",
  });

  // Add address state
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [newAddressName, setNewAddressName] = useState("");

  // Bulk selection state
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [isBulkMode, setIsBulkMode] = useState(false);

  // Tags state
  const [tagInput, setTagInput] = useState("");
  const [editTagInput, setEditTagInput] = useState("");

  // Link expense state
  const [isLinkExpenseOpen, setIsLinkExpenseOpen] = useState(false);
  const [linkExpenseSearch, setLinkExpenseSearch] = useState("");

  // Hooks
  const activeAddresses = useActiveAddresses();
  const createAddress = useCreateAddress();

  const allDocuments = useAllDocuments();
  const docsByAddress = useDocumentsByAddress(
    selectedAddressId || undefined,
  );
  const docsByType = useDocumentsByType(
    selectedType !== "all" ? selectedType : "bill",
  );

  const generateUploadUrl = useGenerateUploadUrl();
  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument();
  const deleteDocument = useDeleteDocument();
  const { processImage: ocrProcess, isProcessing: ocrProcessing } = useOcr();
  const expiringDocs = useExpiringDocuments(30);
  const searchDocuments = useSearchDocuments(searchTerm);
  const bulkDeleteDocuments = useBulkDeleteDocuments();
  const linkDocumentToExpense = useLinkDocumentToExpense();

  // Get current month expenses for linking
  const currentMonth = format(new Date(), "yyyy-MM");
  const currentMonthExpenses = useExpensesByMonth(currentMonth);

  // Determine which documents to display
  const documents = useMemo(() => {
    // Use server-side search when there's a search term
    if (searchTerm.trim().length >= 2) {
      let docs = (searchDocuments as DocumentItem[]) || [];
      if (selectedType !== "all") {
        docs = docs.filter((d) => d.type === selectedType);
      }
      return docs;
    }

    let docs: DocumentItem[];
    if (selectedType === "bill" && selectedAddressId) {
      docs = (docsByAddress as DocumentItem[]) || [];
    } else if (selectedType !== "all" && selectedType !== "bill") {
      docs = (docsByType as DocumentItem[]) || [];
    } else {
      docs = (allDocuments as DocumentItem[]) || [];
    }

    // Filter by type if not "all"
    if (selectedType !== "all") {
      docs = docs.filter((d) => d.type === selectedType);
    }

    return docs;
  }, [allDocuments, docsByAddress, docsByType, selectedType, selectedAddressId, searchTerm, searchDocuments]);

  // Default address selection is handled in the type filter click handler
  // to avoid setState-in-effect cascading renders

  const handleAddAddress = async () => {
    if (!newAddressName.trim()) return;
    try {
      await createAddress({ name: newAddressName.trim() });
      toast({ title: "Address added", description: newAddressName });
      setNewAddressName("");
      setIsAddAddressOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to add address", variant: "destructive" });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");

    if (!isPdf && !isImage) {
      toast({ title: "Error", description: "Please select a PDF or image file", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "File must be less than 10MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => setUploadPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setUploadPreview(null);
      }

      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) throw new Error("Upload failed");

      const { storageId } = await response.json();
      setUploadData((prev) => ({
        ...prev,
        storageId: storageId as Id<"_storage">,
        fileType: isPdf ? "pdf" : "image",
      }));

      toast({ title: "File uploaded", description: "Add details and save" });
    } catch {
      toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
      setUploadPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveDocument = async () => {
    if (!uploadData.storageId) {
      toast({ title: "Error", description: "Please upload a file first", variant: "destructive" });
      return;
    }

    try {
      const docArgs: Record<string, unknown> = {
        storageId: uploadData.storageId,
        type: uploadData.type,
        title: uploadData.title || undefined,
        amount: uploadData.amount ? parseFloat(uploadData.amount) : undefined,
        date: uploadData.date,
        notes: uploadData.notes || undefined,
        fileType: uploadData.fileType,
        uploadedBy: user?._id as Id<"users"> | undefined,
      };

      if (uploadData.type === "bill") {
        docArgs.addressId = uploadData.addressId
          ? (uploadData.addressId as Id<"addresses">)
          : undefined;
        docArgs.billType = uploadData.billType || undefined;
        docArgs.monthlyAmount = uploadData.monthlyAmount
          ? parseFloat(uploadData.monthlyAmount)
          : undefined;
        docArgs.billPeriod = uploadData.billPeriod || undefined;
      }

      if (["warranty", "insurance", "certificate"].includes(uploadData.type)) {
        docArgs.expiryDate = uploadData.expiryDate || undefined;
      }

      // Tags
      const tags = tagInput.split(",").map(t => t.trim()).filter(Boolean);
      if (tags.length) docArgs.tags = tags;

      await createDocument(docArgs as Parameters<typeof createDocument>[0]);

      toast({ title: "Document saved" });
      setIsUploadOpen(false);
      resetUploadData();
    } catch {
      toast({ title: "Error", description: "Failed to save document", variant: "destructive" });
    }
  };

  const resetUploadData = () => {
    setUploadData({
      storageId: null,
      type: "receipt",
      title: "",
      amount: "",
      date: format(new Date(), "yyyy-MM-dd"),
      notes: "",
      fileType: "",
      addressId: "",
      billType: "",
      monthlyAmount: "",
      billPeriod: "",
      expiryDate: "",
    });
    setUploadPreview(null);
    setTagInput("");
  };

  const handleDeleteDocument = async (doc: DocumentItem) => {
    if (!confirm(`Delete "${doc.title || "this document"}"?`)) return;
    try {
      await deleteDocument({ id: doc._id });
      toast({ title: "Document deleted" });
      setIsViewOpen(false);
      setSelectedDoc(null);
    } catch {
      toast({ title: "Error", description: "Failed to delete document", variant: "destructive" });
    }
  };

  const handleUpdateDocument = async () => {
    if (!selectedDoc) return;
    try {
      const editTags = editTagInput.split(",").map(t => t.trim()).filter(Boolean);
      await updateDocument({
        id: selectedDoc._id,
        title: editData.title || undefined,
        amount: editData.amount ? parseFloat(editData.amount) : undefined,
        notes: editData.notes || undefined,
        billType: editData.billType || undefined,
        monthlyAmount: editData.monthlyAmount
          ? parseFloat(editData.monthlyAmount)
          : undefined,
        billPeriod: editData.billPeriod || undefined,
        expiryDate: editData.expiryDate || undefined,
        tags: editTags.length ? editTags : undefined,
      });
      toast({ title: "Document updated" });
      setIsEditOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to update document", variant: "destructive" });
    }
  };

  const openDocumentView = (doc: DocumentItem) => {
    if (isBulkMode) {
      toggleDocSelection(doc._id);
      return;
    }
    setSelectedDoc(doc);
    setEditData({
      title: doc.title || "",
      amount: doc.amount?.toString() || "",
      notes: doc.notes || "",
      billType: doc.billType || "",
      monthlyAmount: doc.monthlyAmount?.toString() || "",
      billPeriod: doc.billPeriod || "",
      expiryDate: doc.expiryDate || "",
    });
    setEditTagInput((doc.tags || []).join(", "));
    setIsViewOpen(true);
  };

  const toggleDocSelection = (docId: string) => {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedDocIds.size} selected documents?`)) return;
    try {
      await bulkDeleteDocuments({ ids: Array.from(selectedDocIds) as Id<"documents">[] });
      toast({ title: `${selectedDocIds.size} documents deleted` });
      setSelectedDocIds(new Set());
      setIsBulkMode(false);
    } catch {
      toast({ title: "Error", description: "Failed to delete documents", variant: "destructive" });
    }
  };

  const handleLinkExpense = async (expenseId: Id<"expenses">) => {
    if (!selectedDoc) return;
    try {
      await linkDocumentToExpense({ documentId: selectedDoc._id, expenseId });
      toast({ title: "Linked to expense" });
      setIsLinkExpenseOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to link expense", variant: "destructive" });
    }
  };

  const downloadDocument = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Documents
          </h1>
          <p className="text-muted-foreground">
            {allDocuments?.length || 0} documents stored
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant={isBulkMode ? "default" : "outline"}
            size="sm"
            onClick={() => { setIsBulkMode(!isBulkMode); setSelectedDocIds(new Set()); }}
          >
            <CheckSquare className="h-4 w-4 mr-1" />
            {isBulkMode ? "Done" : "Select"}
          </Button>
          <Button onClick={() => setIsUploadOpen(true)} disabled={DEMO_MODE}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      {/* Expiring Soon Banner */}
      {expiringDocs && expiringDocs.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              {expiringDocs.length} document{expiringDocs.length !== 1 ? "s" : ""} expiring soon
            </p>
            <p className="text-xs text-amber-600">
              Warranties, insurance, and certificates expiring within 30 days
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
            onClick={() => setSelectedType("all")}
          >
            View All
          </Button>
        </div>
      )}

      {/* Bulk Operations Toolbar */}
      {isBulkMode && (
        <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{selectedDocIds.size} selected</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setSelectedDocIds(new Set()); setIsBulkMode(false); }}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={selectedDocIds.size === 0}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Type Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {DOCUMENT_TYPE_OPTIONS.map((t) => (
          <Button
            key={t.value}
            variant={selectedType === t.value ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedType(t.value);
              if (t.value === "bill" && activeAddresses?.length) {
                setSelectedAddressId(activeAddresses[0]._id);
              } else {
                setSelectedAddressId(null);
              }
            }}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {/* Address Selector (for bills) */}
      {selectedType === "bill" && activeAddresses && activeAddresses.length > 0 && (
        <div className="mb-6">
          <Label className="text-sm font-medium mb-2 block">Select Address</Label>
          <div className="flex flex-wrap gap-2">
            {activeAddresses.map((address) => (
              <Button
                key={address._id}
                variant={
                  selectedAddressId === address._id ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedAddressId(address._id)}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                <span className="max-w-[150px] truncate">{address.name}</span>
                <Badge variant="secondary" className="ml-1">
                  {address.billCount}
                </Badge>
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddAddressOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Address
            </Button>
          </div>
        </div>
      )}

      {/* Documents Grid */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            {DOCUMENT_TYPE_OPTIONS.find((t) => t.value === selectedType)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "No documents match your search" : "No documents yet"}
              </p>
              {!searchTerm && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsUploadOpen(true)}
                  disabled={DEMO_MODE}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload your first document
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {documents.map((doc) => (
                <Card
                  key={doc._id}
                  className={`overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group relative ${selectedDocIds.has(doc._id) ? "ring-2 ring-primary" : ""}`}
                  onClick={() => openDocumentView(doc)}
                >
                  {isBulkMode && (
                    <div className="absolute top-2 left-2 z-10">
                      {selectedDocIds.has(doc._id) ? (
                        <CheckSquare className="h-5 w-5 text-primary bg-white rounded" />
                      ) : (
                        <Square className="h-5 w-5 text-white bg-black/30 rounded" />
                      )}
                    </div>
                  )}
                  <div className="aspect-[3/4] relative bg-muted">
                    {doc.fileType === "pdf" ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-red-50">
                        <span className="text-4xl mb-2">📄</span>
                        <span className="text-xs text-red-600 font-medium">
                          PDF
                        </span>
                      </div>
                    ) : doc.url ? (
                      <img
                        src={doc.url}
                        alt={doc.title || "Document"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="h-8 w-8 text-white" />
                    </div>
                    {doc.linkedExpenseCount > 0 && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {doc.linkedExpenseCount}
                      </div>
                    )}
                    <Badge
                      className={`absolute top-2 ${isBulkMode ? "left-8" : "left-2"} text-xs ${TYPE_COLORS[doc.type] || "bg-gray-100 text-gray-800"}`}
                    >
                      {TYPE_ICONS[doc.type] || "📎"} {doc.type}
                    </Badge>
                  </div>
                  <CardContent className="p-3">
                    <p className="font-semibold text-sm truncate">
                      {doc.title || "Untitled"}
                    </p>
                    {doc.amount && (
                      <p className="text-xs text-muted-foreground">
                        £{doc.amount.toFixed(2)}
                        {doc.monthlyAmount && (
                          <span className="text-green-600 ml-1">
                            (£{doc.monthlyAmount.toFixed(2)}/mo)
                          </span>
                        )}
                      </p>
                    )}
                    {doc.billPeriod && (
                      <p className="text-xs text-muted-foreground truncate">
                        {doc.billPeriod}
                      </p>
                    )}
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {doc.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                        {doc.tags.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{doc.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(doc.date), "MMM d, yyyy")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Address Dialog */}
      <Dialog open={isAddAddressOpen} onOpenChange={setIsAddAddressOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
            <DialogDescription>
              Add a new address to organize bills
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="e.g., 123 Main Street, London"
                value={newAddressName}
                onChange={(e) => setNewAddressName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddAddressOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAddress} disabled={!newAddressName.trim()}>
              Add Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* File Upload */}
            {!uploadData.storageId ? (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center w-full gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center w-full"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">
                      Click to upload PDF or image
                    </p>
                    <p className="text-xs text-muted-foreground">Max 10MB</p>
                  </button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.capture = "environment";
                      input.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files?.[0]) {
                          const event = { target: { files } } as React.ChangeEvent<HTMLInputElement>;
                          handleFileSelect(event);
                        }
                      };
                      input.click();
                    }}
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    Take Photo
                  </Button>
                </div>
                )}
              </div>
            ) : (
              <div className="relative">
                {uploadPreview ? (
                  <img
                    src={uploadPreview}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-40 bg-red-50 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-4xl mb-2">📄</span>
                    <span className="text-sm font-medium">PDF Document</span>
                  </div>
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={() => resetUploadData()}
                >
                  <X className="h-3 w-3" />
                </Button>
                {uploadData.fileType === "image" && uploadData.storageId && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    disabled={ocrProcessing}
                    onClick={async () => {
                      // Try to get the file from input or use filename-based OCR
                      const file = fileInputRef.current?.files?.[0];
                      if (file) {
                        const result = await ocrProcess(file);
                        if (result.amount) {
                          setUploadData((prev) => ({ ...prev, amount: result.amount!.toString() }));
                        }
                        if (result.date) {
                          setUploadData((prev) => ({ ...prev, date: result.date! }));
                        }
                        if (result.merchant) {
                          setUploadData((prev) => ({ ...prev, title: result.merchant! }));
                        }
                        toast({ title: "Auto-detected", description: `Found: ${result.amount ? `£${result.amount}` : ""} ${result.merchant || ""}`.trim() || "No clear data found" });
                      }
                    }}
                  >
                    {ocrProcessing ? "Analyzing..." : "Auto-detect from receipt"}
                  </Button>
                )}
              </div>
            )}

            {/* Document Details */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select
                  value={uploadData.type}
                  onValueChange={(value) =>
                    setUploadData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPE_OPTIONS.filter((t) => t.value !== "all").map(
                      (t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Council Tax 2025"
                  value={uploadData.title}
                  onChange={(e) =>
                    setUploadData((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (£)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={uploadData.amount}
                    onChange={(e) =>
                      setUploadData((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="docDate">Date</Label>
                  <Input
                    id="docDate"
                    type="date"
                    value={uploadData.date}
                    onChange={(e) =>
                      setUploadData((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Bill-specific fields */}
              {uploadData.type === "bill" && (
                <>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Select
                      value={uploadData.addressId}
                      onValueChange={(value) =>
                        setUploadData((prev) => ({
                          ...prev,
                          addressId: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select address" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeAddresses?.map((addr) => (
                          <SelectItem key={addr._id} value={addr._id}>
                            {addr.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Bill Type</Label>
                    <Select
                      value={uploadData.billType}
                      onValueChange={(value) =>
                        setUploadData((prev) => ({
                          ...prev,
                          billType: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {BILL_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="monthlyAmount">Monthly (£)</Label>
                      <Input
                        id="monthlyAmount"
                        type="number"
                        step="0.01"
                        value={uploadData.monthlyAmount}
                        onChange={(e) =>
                          setUploadData((prev) => ({
                            ...prev,
                            monthlyAmount: e.target.value,
                          }))
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billPeriod">Period</Label>
                      <Input
                        id="billPeriod"
                        value={uploadData.billPeriod}
                        onChange={(e) =>
                          setUploadData((prev) => ({
                            ...prev,
                            billPeriod: e.target.value,
                          }))
                        }
                        placeholder="e.g., Jan 2025 - Dec 2025"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Expiry fields */}
              {["warranty", "insurance", "certificate"].includes(uploadData.type) && (
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={uploadData.expiryDate}
                    onChange={(e) =>
                      setUploadData((prev) => ({
                        ...prev,
                        expiryDate: e.target.value,
                      }))
                    }
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="tags">
                  <Tag className="h-3 w-3 inline mr-1" />
                  Tags (comma separated)
                </Label>
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="e.g., groceries, tesco, utilities"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  value={uploadData.notes}
                  onChange={(e) =>
                    setUploadData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadOpen(false);
                resetUploadData();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveDocument} disabled={!uploadData.storageId}>
              Save Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {selectedDoc && (
                  <>
                    <Badge className={TYPE_COLORS[selectedDoc.type] || ""}>
                      {TYPE_ICONS[selectedDoc.type] || "📎"} {selectedDoc.type}
                    </Badge>
                    <span className="truncate max-w-[300px]">
                      {selectedDoc.title || "Untitled"}
                    </span>
                  </>
                )}
              </span>
              <div className="flex gap-2">
                {selectedDoc?.url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadDocument(
                        selectedDoc.url,
                        selectedDoc.title || "document",
                      )
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsLinkExpenseOpen(true)}
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Link to Expense
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => selectedDoc && handleDeleteDocument(selectedDoc)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedDoc && (
            <div className="flex flex-col gap-4 overflow-hidden">
              {/* Document Info */}
              <div className="flex flex-wrap gap-4 p-3 bg-muted rounded-lg">
                {selectedDoc.amount && (
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-medium">
                      £{selectedDoc.amount.toFixed(2)}
                    </p>
                  </div>
                )}
                {selectedDoc.monthlyAmount && (
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly</p>
                    <p className="font-medium text-green-600">
                      £{selectedDoc.monthlyAmount.toFixed(2)}
                    </p>
                  </div>
                )}
                {selectedDoc.billPeriod && (
                  <div>
                    <p className="text-xs text-muted-foreground">Period</p>
                    <p className="font-medium">{selectedDoc.billPeriod}</p>
                  </div>
                )}
                {selectedDoc.expiryDate && (
                  <div>
                    <p className="text-xs text-muted-foreground">Expires</p>
                    <p className="font-medium text-amber-600">
                      {format(new Date(selectedDoc.expiryDate), "MMM d, yyyy")}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(selectedDoc.date), "MMM d, yyyy")}
                  </p>
                </div>
                {selectedDoc.linkedExpenseCount > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Linked</p>
                    <p className="font-medium text-green-600">
                      {selectedDoc.linkedExpenseCount} expense
                      {selectedDoc.linkedExpenseCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </div>

              {/* Tags */}
              {selectedDoc.tags && selectedDoc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedDoc.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Linked Expenses */}
              {selectedDoc._id && <LinkedExpensesSection documentId={selectedDoc._id} />}

              {/* Version History */}
              {selectedDoc.versionHistory && selectedDoc.versionHistory.length > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium flex items-center gap-2 mb-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    Version History ({selectedDoc.versionHistory.length})
                  </p>
                  <div className="space-y-1">
                    {selectedDoc.versionHistory.map((v, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        Version {i + 1} — replaced {v.replacedAt ? format(new Date(v.replacedAt), "MMM d, yyyy") : "unknown date"}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Document Preview */}
              <div className="flex-1 overflow-auto rounded-lg border">
                {selectedDoc.fileType === "pdf" ? (
                  <div className="w-full h-96 flex flex-col items-center justify-center bg-red-50">
                    <span className="text-6xl mb-4">📄</span>
                    <p className="text-sm font-medium">PDF Document</p>
                    {selectedDoc.url && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => window.open(selectedDoc.url, "_blank")}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Open in New Tab
                      </Button>
                    )}
                  </div>
                ) : selectedDoc.url ? (
                  <img
                    src={selectedDoc.url}
                    alt={selectedDoc.title || "Document"}
                    className="w-full h-auto"
                  />
                ) : (
                  <div className="w-full h-96 flex items-center justify-center">
                    <Image className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editData.title}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Amount (£)</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  value={editData.amount}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-monthly">Monthly (£)</Label>
                <Input
                  id="edit-monthly"
                  type="number"
                  step="0.01"
                  value={editData.monthlyAmount}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      monthlyAmount: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            {selectedDoc?.type === "bill" && (
              <>
                <div className="space-y-2">
                  <Label>Bill Type</Label>
                  <Select
                    value={editData.billType}
                    onValueChange={(value) =>
                      setEditData((prev) => ({ ...prev, billType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BILL_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-period">Period</Label>
                  <Input
                    id="edit-period"
                    value={editData.billPeriod}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        billPeriod: e.target.value,
                      }))
                    }
                  />
                </div>
              </>
            )}
            {selectedDoc &&
              ["warranty", "insurance", "certificate"].includes(
                selectedDoc.type,
              ) && (
                <div className="space-y-2">
                  <Label htmlFor="edit-expiry">Expiry Date</Label>
                  <Input
                    id="edit-expiry"
                    type="date"
                    value={editData.expiryDate}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        expiryDate: e.target.value,
                      }))
                    }
                  />
                </div>
              )}
            <div className="space-y-2">
              <Label htmlFor="edit-tags">
                <Tag className="h-3 w-3 inline mr-1" />
                Tags (comma separated)
              </Label>
              <Input
                id="edit-tags"
                value={editTagInput}
                onChange={(e) => setEditTagInput(e.target.value)}
                placeholder="e.g., groceries, tesco"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Input
                id="edit-notes"
                value={editData.notes}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateDocument}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link to Expense Dialog */}
      <Dialog open={isLinkExpenseOpen} onOpenChange={setIsLinkExpenseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Link to Expense</DialogTitle>
            <DialogDescription>
              Link this document to an expense from the current month
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={linkExpenseSearch}
                onChange={(e) => setLinkExpenseSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {currentMonthExpenses
                ?.filter((exp: { description?: string; category?: string }) =>
                  !linkExpenseSearch ||
                  (exp.description || "").toLowerCase().includes(linkExpenseSearch.toLowerCase()) ||
                  (exp.category || "").toLowerCase().includes(linkExpenseSearch.toLowerCase())
                )
                .map((expense: { _id?: string; id?: string; description?: string; category?: string; date: string; amount?: number }) => (
                  <button
                    key={expense._id || expense.id}
                    onClick={() => handleLinkExpense(expense._id || expense.id)}
                    className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors flex justify-between items-center"
                  >
                    <div>
                      <p className="text-sm font-medium">{expense.description || "Expense"}</p>
                      <p className="text-xs text-muted-foreground">{expense.category} — {format(new Date(expense.date), "MMM d, yyyy")}</p>
                    </div>
                    <span className="text-sm font-semibold">£{expense.amount?.toFixed(2)}</span>
                  </button>
                ))}
              {(!currentMonthExpenses || currentMonthExpenses.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No expenses found this month</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkExpenseOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};



const LinkedExpensesSection = ({
  documentId,
}: {
  documentId: Id<"documents">;
}) => {
  const navigate = useNavigate();
  const docDetails = useDocumentById(documentId);

  if (!docDetails?.linkedExpenses?.length) return null;

  return (
    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
      <p className="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
        <Receipt className="h-4 w-4" />
        Linked Expenses ({docDetails.linkedExpenses.length})
      </p>
      <div className="space-y-1">
        {docDetails.linkedExpenses.map((exp) => (
          <button
            key={exp._id}
            onClick={() => navigate("/")}
            className="w-full text-left text-sm text-green-700 flex justify-between items-center hover:bg-green-100 rounded px-2 py-1 transition-colors"
          >
            <span className="truncate">{exp.description || "Payment"}</span>
            <span className="shrink-0 ml-2">
              £{exp.amount.toFixed(2)} on{" "}
              {format(new Date(exp.date), "MMM d, yyyy")}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Documents;

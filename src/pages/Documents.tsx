import { useState, useRef, useMemo } from "react";

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

  useExpiringDocuments,
  useSearchDocuments,
  useBulkDeleteDocuments,
  useExpensesByMonth,
  useLinkDocumentToExpense,
} from "@/hooks/useConvexData";
import { Id } from "../../convex/_generated/dataModel";
import { DEMO_MODE } from "@/lib/demoData";
import { useOcr } from "@/hooks/useOcr";
import CategorySelector from "@/components/expense/CategorySelector";
import LocationSelector from "@/components/expense/LocationSelector";
import { format } from "date-fns";
import {
  Home,
  Plus,
  Upload,
  FileText,
  Download,
  Edit,
  Trash2,
  Search,
  Eye,
  X,
  Loader2,
  Camera,
  AlertTriangle,
  Link2,
  CheckSquare,
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
  category?: string;
  location?: string;
  linkedExpenseCount: number;
  tags?: string[];
  versionHistory?: Record<string, string>[];
}

const Documents = () => {
  const { user } = useAuth();

  // Filters
  const [selectedType, setSelectedType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
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
    date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
    fileType: "",
    // Categorisation
    category: "",
    location: "",
    // Bill-specific
    addressId: "" as string,
    monthlyAmount: "",
    billPeriod: "",
    // Expiry
    expiryDate: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // View/Edit state
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    title: "",
    notes: "",
    category: "",
    location: "",
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
    selectedType !== "all" && selectedType !== "bill" ? selectedType : "bill",
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

  // Get current month expenses for linking (only when dialog is open)
  const currentMonth = format(new Date(), "yyyy-MM");
  const currentMonthExpenses = useExpensesByMonth(
    isLinkExpenseOpen ? currentMonth : "skip",
  );

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

    // Filter by location
    if (selectedLocation !== "all") {
      docs = docs.filter((d) => d.location === selectedLocation);
    }

    return docs;
  }, [allDocuments, docsByAddress, docsByType, selectedType, selectedLocation, selectedAddressId, searchTerm, searchDocuments]);

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
        date: uploadData.date,
        notes: uploadData.notes || undefined,
        fileType: uploadData.fileType,
        uploadedBy: user?._id as Id<"users"> | undefined,
      };

      docArgs.category = uploadData.category || undefined;
      docArgs.location = uploadData.location || undefined;

      if (uploadData.type === "bill") {
        docArgs.addressId = uploadData.addressId
          ? (uploadData.addressId as Id<"addresses">)
          : undefined;
        docArgs.monthlyAmount = uploadData.monthlyAmount
          ? parseFloat(uploadData.monthlyAmount)
          : undefined;
        docArgs.billPeriod = uploadData.billPeriod || undefined;
      }

      if (["warranty", "insurance", "certificate"].includes(uploadData.type)) {
        docArgs.expiryDate = uploadData.expiryDate || undefined;
      }

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
      category: "",
      location: "",
      addressId: "",
      monthlyAmount: "",
      billPeriod: "",
      expiryDate: "",
    });
    setUploadPreview(null);
  };

  const handleDeleteDocument = async (doc: DocumentItem) => {
    if (!confirm(`Delete "${doc.title || "this document"}"?`)) return;
    try {
      await deleteDocument({ id: doc._id });
      toast({ title: "Document deleted" });
      setSelectedDoc(null);
    } catch {
      toast({ title: "Error", description: "Failed to delete document", variant: "destructive" });
    }
  };

  const handleUpdateDocument = async () => {
    if (!selectedDoc) return;
    try {
      await updateDocument({
        id: selectedDoc._id,
        title: editData.title || undefined,
        notes: editData.notes || undefined,
        category: editData.category || undefined,
        location: editData.location || undefined,
        monthlyAmount: editData.monthlyAmount
          ? parseFloat(editData.monthlyAmount)
          : undefined,
        billPeriod: editData.billPeriod || undefined,
        expiryDate: editData.expiryDate || undefined,
      });
      toast({ title: "Document updated" });
      setIsEditOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to update document", variant: "destructive" });
    }
  };

  const openDocument = (doc: DocumentItem) => {
    if (isBulkMode) {
      toggleDocSelection(doc._id);
      return;
    }
    if (doc.url) {
      window.open(doc.url, "_blank");
    }
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 items-end">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select value={selectedType} onValueChange={(value) => {
            setSelectedType(value);
            if (value === "bill" && activeAddresses?.length) {
              setSelectedAddressId(activeAddresses[0]._id);
            } else {
              setSelectedAddressId(null);
            }
          }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPE_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Location</Label>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {Array.from(new Set(allDocuments?.map((d) => d.location).filter(Boolean) ?? [])).sort().map((loc) => (
                <SelectItem key={loc} value={loc || "all"}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(selectedType !== "all" || selectedLocation !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            className="mb-0.5"
            onClick={() => {
              setSelectedType("all");
              setSelectedLocation("all");
              setSelectedAddressId(null);
            }}
          >
            Clear filters
          </Button>
        )}
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

      {/* Documents Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            {DOCUMENT_TYPE_OPTIONS.find((t) => t.value === selectedType)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allDocuments === undefined || searchDocuments === undefined ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : documents.length === 0 ? (
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    {isBulkMode && (
                      <th className="px-3 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={documents.length > 0 && documents.every((d) => selectedDocIds.has(d._id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDocIds(new Set(documents.map((d) => d._id)));
                            } else {
                              setSelectedDocIds(new Set());
                            }
                          }}
                          className="h-4 w-4 rounded border-border"
                        />
                      </th>
                    )}
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Title</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Category</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Location</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Linked</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {documents.map((doc) => (
                    <tr
                      key={doc._id}
                      className={`hover:bg-muted/50 transition-colors ${selectedDocIds.has(doc._id) ? "bg-primary/5" : ""}`}
                    >
                      {isBulkMode && (
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={selectedDocIds.has(doc._id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleDocSelection(doc._id);
                            }}
                            className="h-4 w-4 rounded border-border"
                          />
                        </td>
                      )}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <Badge className={`text-xs ${TYPE_COLORS[doc.type] || "bg-gray-100 text-gray-800"}`}>
                          {TYPE_ICONS[doc.type] || "📎"} {doc.type}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => openDocument(doc)}
                          className="text-left hover:underline font-medium text-sm truncate max-w-[200px] block"
                        >
                          {doc.title || doc.filename || "Untitled"}
                        </button>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-muted-foreground">
                        {doc.category || "—"}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-muted-foreground">
                        {doc.location || "—"}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-muted-foreground">
                        {(() => {
                          const [y, m, d] = doc.date.split("-").map(Number);
                          return format(new Date(y, m - 1, d), "MMM d, yyyy");
                        })()}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {doc.linkedExpenseCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            <FileText className="h-3 w-3" />
                            {doc.linkedExpenseCount}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDocument(doc);
                            }}
                            aria-label="View document"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadDocument(doc.url, doc.title || doc.filename || "document");
                            }}
                            aria-label="Download document"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDoc(doc);
                              setEditData({
                                title: doc.title || "",
                                notes: doc.notes || "",
                                category: doc.category || "",
                                location: doc.location || "",
                                monthlyAmount: doc.monthlyAmount?.toString() || "",
                                billPeriod: doc.billPeriod || "",
                                expiryDate: doc.expiryDate || "",
                              });
                              setIsEditOpen(true);
                            }}
                            aria-label="Edit document"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDoc(doc);
                              setIsLinkExpenseOpen(true);
                            }}
                            aria-label="Link to expense"
                          >
                            <Link2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDoc(doc);
                              handleDeleteDocument(doc);
                            }}
                            aria-label="Delete document"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  accept=".pdf,image/*,application/pdf"
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

              {/* Category & Location */}
              <CategorySelector
                selectedCategory={uploadData.category}
                onChange={(category) => setUploadData((prev) => ({ ...prev, category }))}
              />
              <LocationSelector
                selectedLocation={uploadData.location}
                onChange={(location) => setUploadData((prev) => ({ ...prev, location }))}
              />

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
            <CategorySelector
              selectedCategory={editData.category}
              onChange={(category) => setEditData((prev) => ({ ...prev, category }))}
            />
            <LocationSelector
              selectedLocation={editData.location}
              onChange={(location) => setEditData((prev) => ({ ...prev, location }))}
            />
            {selectedDoc?.type === "bill" && (
              <>
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

export default Documents;

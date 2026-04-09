import { useState, useRef, useEffect } from "react";
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
  useArchivedAddresses,
  useCreateAddress,
  useUnarchiveAddress,
  useDeleteAddress,
  useAllBills,
  useBillsByAddress,
  useGenerateBillUploadUrl,
  useCreateBill,
  useUpdateBill,
  useDeleteBill,
  useLinkBillToExpense,
  useCreateExpense,
} from "@/hooks/useConvexData";
import { Id } from "../../convex/_generated/dataModel";
import { DEMO_MODE } from "@/lib/demoData";
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
  Archive,
  ArchiveRestore,
  Link,
  Building2,
  Receipt,
  X,
  Loader2,
  Eye,
} from "lucide-react";

const BILL_TYPES = [
  { value: "council-tax", label: "Council Tax", icon: "🏛️" },
  { value: "electricity", label: "Electricity", icon: "⚡" },
  { value: "gas", label: "Gas", icon: "🔥" },
  { value: "water", label: "Water", icon: "💧" },
  { value: "internet", label: "Internet", icon: "🌐" },
  { value: "insurance", label: "Insurance", icon: "🛡️" },
  { value: "tv-license", label: "TV License", icon: "📺" },
  { value: "service-charge", label: "Service Charge", icon: "🏢" },
  { value: "maintenance", label: "Maintenance", icon: "🔧" },
  { value: "receipt", label: "Receipt", icon: "🧾" },
  { value: "invoice", label: "Invoice", icon: "📄" },
  { value: "other", label: "Other", icon: "📋" },
];

interface BillItem {
  _id: Id<"bills">;
  storageId: Id<"_storage">;
  addressId: Id<"addresses">;
  filename: string;
  billType?: string;
  amount?: number;
  monthlyAmount?: number;
  billPeriod?: string;
  billDate?: string;
  uploadDate: string;
  fileType: string;
  isShared?: boolean;
  url: string;
  linkedExpenseCount: number;
  linkedExpenses?: Array<{
    _id: Id<"expenses">;
    amount: number;
    date: string;
    description?: string;
    paidByName: string;
  }>;
}

const Bills = () => {
  const { user } = useAuth();

  // Address state
  const [selectedAddressId, setSelectedAddressId] =
    useState<Id<"addresses"> | null>(null);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [newAddressName, setNewAddressName] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  // Bill upload state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadData, setUploadData] = useState({
    storageId: null as Id<"_storage"> | null,
    filename: "",
    billType: "",
    amount: "",
    monthlyAmount: "",
    billPeriod: "",
    billDate: format(new Date(), "yyyy-MM-dd"),
    fileType: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // View/Edit state
  const [selectedBill, setSelectedBill] = useState<BillItem | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    filename: "",
    billType: "",
    amount: "",
    monthlyAmount: "",
    billPeriod: "",
  });

  // Quick add expense state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    amount: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
  });

  // Hooks
  const activeAddresses = useActiveAddresses();
  const archivedAddresses = useArchivedAddresses();
  const createAddress = useCreateAddress();
  const unarchiveAddress = useUnarchiveAddress();
  const deleteAddress = useDeleteAddress();

  const allBills = useAllBills();
  const billsByAddress = useBillsByAddress(selectedAddressId || undefined);
  const generateUploadUrl = useGenerateBillUploadUrl();
  const createBill = useCreateBill();
  const updateBill = useUpdateBill();
  const deleteBill = useDeleteBill();
  const linkBillToExpense = useLinkBillToExpense();
  const createExpense = useCreateExpense();

  const addresses = showArchived ? archivedAddresses : activeAddresses;
  const bills = selectedAddressId ? billsByAddress : allBills;

  // Set first address as selected by default
  useEffect(() => {
    if (activeAddresses?.length && !selectedAddressId) {
      setSelectedAddressId(activeAddresses[0]._id);
    }
  }, [activeAddresses, selectedAddressId]);

  const handleAddAddress = async () => {
    if (!newAddressName.trim()) return;

    try {
      await createAddress({ name: newAddressName.trim() });
      toast({ title: "Address added", description: newAddressName });
      setNewAddressName("");
      setIsAddAddressOpen(false);
    } catch {
      toast({
        title: "Error",
        description: "Failed to add address",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (PDF or image)
    const isPdf = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");

    if (!isPdf && !isImage) {
      toast({
        title: "Error",
        description: "Please select a PDF or image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create preview for images
      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => setUploadPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setUploadPreview(null); // No preview for PDFs
      }

      // Upload to Convex
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
        filename: file.name,
        fileType: isPdf ? "pdf" : "image",
      }));

      toast({ title: "File uploaded", description: "Add details and save" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
      setUploadPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveBill = async () => {
    if (!uploadData.storageId || !selectedAddressId) {
      toast({
        title: "Error",
        description: "Missing required information",
        variant: "destructive",
      });
      return;
    }

    try {
      await createBill({
        storageId: uploadData.storageId,
        addressId: selectedAddressId,
        filename: uploadData.filename || "Untitled",
        billType: uploadData.billType || undefined,
        amount: uploadData.amount ? parseFloat(uploadData.amount) : undefined,
        monthlyAmount: uploadData.monthlyAmount
          ? parseFloat(uploadData.monthlyAmount)
          : undefined,
        billPeriod: uploadData.billPeriod || undefined,
        billDate: uploadData.billDate || undefined,
        fileType: uploadData.fileType,
        uploadedBy: user?._id as Id<"users"> | undefined,
      });

      toast({
        title: "Bill saved",
        description: uploadData.filename || "Untitled",
      });
      setIsUploadOpen(false);
      resetUploadData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to save bill",
        variant: "destructive",
      });
    }
  };

  const resetUploadData = () => {
    setUploadData({
      storageId: null,
      filename: "",
      billType: "",
      amount: "",
      monthlyAmount: "",
      billPeriod: "",
      billDate: format(new Date(), "yyyy-MM-dd"),
      fileType: "",
    });
    setUploadPreview(null);
  };

  const handleDeleteBill = async (bill: BillItem) => {
    if (!confirm(`Delete "${bill.filename}"?`)) return;

    try {
      await deleteBill({ id: bill._id });
      toast({ title: "Bill deleted" });
      setIsViewOpen(false);
      setSelectedBill(null);
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete bill",
        variant: "destructive",
      });
    }
  };

  const handleUpdateBill = async () => {
    if (!selectedBill) return;

    try {
      await updateBill({
        id: selectedBill._id,
        filename: editData.filename,
        billType: editData.billType || undefined,
        amount: editData.amount ? parseFloat(editData.amount) : undefined,
        monthlyAmount: editData.monthlyAmount
          ? parseFloat(editData.monthlyAmount)
          : undefined,
        billPeriod: editData.billPeriod || undefined,
      });

      toast({ title: "Bill updated" });
      setIsEditOpen(false);
    } catch {
      toast({
        title: "Error",
        description: "Failed to update bill",
        variant: "destructive",
      });
    }
  };

  const handleQuickAddExpense = async () => {
    if (!selectedBill || !quickAddData.amount) return;

    try {
      // Create expense linked to this bill
      const expenseId = await createExpense({
        amount: parseFloat(quickAddData.amount),
        date: quickAddData.date,
        month: quickAddData.date.substring(0, 7),
        description:
          quickAddData.description || `${selectedBill.filename} payment`,
        paidById: user?._id as Id<"users">,
        categoryId: "bills" as Id<"categories">, // You may want to create a proper bills category
        locationId: "home" as Id<"locations">,
        splitType: "50/50",
        linkedBillId: selectedBill._id,
      });

      // Link bill to expense
      await linkBillToExpense({
        billId: selectedBill._id,
        expenseId,
      });

      toast({ title: "Expense created and linked to bill" });
      setIsQuickAddOpen(false);
      setQuickAddData({
        amount: "",
        description: "",
        date: format(new Date(), "yyyy-MM-dd"),
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to create expense",
        variant: "destructive",
      });
    }
  };

  const downloadBill = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openBillView = (bill: BillItem) => {
    setSelectedBill(bill);
    setEditData({
      filename: bill.filename,
      billType: bill.billType || "",
      amount: bill.amount?.toString() || "",
      monthlyAmount: bill.monthlyAmount?.toString() || "",
      billPeriod: bill.billPeriod || "",
    });
    setIsViewOpen(true);
  };

  const getBillTypeLabel = (type?: string) => {
    return BILL_TYPES.find((t) => t.value === type)?.label || "Other";
  };

  const getBillTypeIcon = (type?: string) => {
    return BILL_TYPES.find((t) => t.value === type)?.icon || "📋";
  };

  if (!addresses) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Bills & Documents
          </h1>
          <p className="text-muted-foreground">
            {allBills?.length || 0} documents across{" "}
            {activeAddresses?.length || 0} addresses
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? (
              <ArchiveRestore className="h-4 w-4 mr-2" />
            ) : (
              <Archive className="h-4 w-4 mr-2" />
            )}
            {showArchived ? "Active" : "Archived"}
          </Button>
          <Button
            onClick={() => setIsAddAddressOpen(true)}
            disabled={DEMO_MODE}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Address
          </Button>
        </div>
      </div>

      {/* Address Selector */}
      {!showArchived && activeAddresses && activeAddresses.length > 0 && (
        <div className="mb-6">
          <Label className="text-sm font-medium mb-2 block">
            Select Address
          </Label>
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
          </div>
        </div>
      )}

      {/* Bills Grid */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            {showArchived
              ? "Archived Addresses"
              : selectedAddressId
                ? `Bills for ${activeAddresses?.find((a) => a._id === selectedAddressId)?.name || "Selected Address"}`
                : "All Bills"}
          </CardTitle>
          {!showArchived && selectedAddressId && (
            <Button onClick={() => setIsUploadOpen(true)} disabled={DEMO_MODE}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Bill
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {showArchived ? (
            // Archived Addresses View
            <div className="space-y-2">
              {archivedAddresses?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No archived addresses
                </p>
              ) : (
                archivedAddresses?.map((address) => (
                  <div
                    key={address._id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Archive className="h-4 w-4 text-muted-foreground" />
                      <span>{address.name}</span>
                      <Badge variant="secondary">
                        {address.billCount} bills
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => unarchiveAddress({ id: address._id })}
                      >
                        <ArchiveRestore className="h-4 w-4 mr-1" />
                        Restore
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (
                            confirm(
                              `Delete "${address.name}" and all its bills?`,
                            )
                          ) {
                            deleteAddress({ id: address._id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // Bills Grid
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {bills?.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No bills yet</p>
                  {selectedAddressId && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setIsUploadOpen(true)}
                      disabled={DEMO_MODE}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload your first bill
                    </Button>
                  )}
                </div>
              ) : (
                bills?.map((bill) => (
                  <Card
                    key={bill._id}
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                    onClick={() => openBillView(bill)}
                  >
                    <div className="aspect-[3/4] relative bg-muted">
                      {bill.fileType === "pdf" ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-red-50">
                          <span className="text-4xl mb-2">📄</span>
                          <span className="text-xs text-red-600 font-medium">
                            PDF
                          </span>
                        </div>
                      ) : bill.url ? (
                        <img
                          src={bill.url}
                          alt={bill.filename}
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
                      {bill.linkedExpenseCount > 0 && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Link className="h-3 w-3" />
                          {bill.linkedExpenseCount}
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-sm">
                          {getBillTypeIcon(bill.billType)}
                        </span>
                        <p className="font-semibold text-sm truncate flex-1">
                          {bill.filename}
                        </p>
                      </div>
                      {bill.amount && (
                        <p className="text-xs text-muted-foreground">
                          £{bill.amount.toFixed(2)}
                          {bill.monthlyAmount && (
                            <span className="text-green-600 ml-1">
                              (£{bill.monthlyAmount.toFixed(2)}/mo)
                            </span>
                          )}
                        </p>
                      )}
                      {bill.billPeriod && (
                        <p className="text-xs text-muted-foreground truncate">
                          {bill.billPeriod}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(bill.uploadDate), "MMM d, yyyy")}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
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
              Add a new address to organize your bills
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
            <Button
              variant="outline"
              onClick={() => setIsAddAddressOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddAddress}
              disabled={!newAddressName.trim()}
            >
              Add Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Bill Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Bill</DialogTitle>
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
                    <p className="text-sm text-muted-foreground">
                      Uploading...
                    </p>
                  </div>
                ) : (
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
                    <span className="text-sm font-medium">
                      {uploadData.filename}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PDF Document
                    </span>
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
              </div>
            )}

            {/* Bill Details */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="filename">Filename</Label>
                <Input
                  id="filename"
                  value={uploadData.filename}
                  onChange={(e) =>
                    setUploadData((prev) => ({
                      ...prev,
                      filename: e.target.value,
                    }))
                  }
                  placeholder="e.g., Council Tax 2025"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billType">Bill Type</Label>
                <Select
                  value={uploadData.billType}
                  onValueChange={(value) =>
                    setUploadData((prev) => ({ ...prev, billType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BILL_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <span className="mr-2">{type.icon}</span>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="amount">Total Amount (£)</Label>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="billPeriod">Bill Period (optional)</Label>
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

              <div className="space-y-2">
                <Label htmlFor="billDate">Bill Date</Label>
                <Input
                  id="billDate"
                  type="date"
                  value={uploadData.billDate}
                  onChange={(e) =>
                    setUploadData((prev) => ({
                      ...prev,
                      billDate: e.target.value,
                    }))
                  }
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
            <Button onClick={handleSaveBill} disabled={!uploadData.storageId}>
              Save Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Bill Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {getBillTypeIcon(selectedBill?.billType)}
                {selectedBill?.filename}
              </span>
              <div className="flex gap-2">
                {selectedBill?.url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadBill(selectedBill.url, selectedBill.filename)
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
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
                  onClick={() => selectedBill && handleDeleteBill(selectedBill)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedBill && (
            <div className="flex flex-col gap-4 overflow-hidden">
              {/* Bill Info */}
              <div className="flex flex-wrap gap-4 p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-medium">
                    {getBillTypeLabel(selectedBill.billType)}
                  </p>
                </div>
                {selectedBill.amount && (
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-medium">
                      £{selectedBill.amount.toFixed(2)}
                    </p>
                  </div>
                )}
                {selectedBill.monthlyAmount && (
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly</p>
                    <p className="font-medium text-green-600">
                      £{selectedBill.monthlyAmount.toFixed(2)}
                    </p>
                  </div>
                )}
                {selectedBill.billPeriod && (
                  <div>
                    <p className="text-xs text-muted-foreground">Period</p>
                    <p className="font-medium">{selectedBill.billPeriod}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Uploaded</p>
                  <p className="font-medium">
                    {format(new Date(selectedBill.uploadDate), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              {/* Linked Expenses */}
              {selectedBill.linkedExpenses &&
                selectedBill.linkedExpenses.length > 0 && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
                      <Link className="h-4 w-4" />
                      Linked Expenses ({selectedBill.linkedExpenses.length})
                    </p>
                    <div className="space-y-1">
                      {selectedBill.linkedExpenses.map((exp) => (
                        <div
                          key={exp._id}
                          className="text-sm text-green-700 flex justify-between"
                        >
                          <span>{exp.description || "Payment"}</span>
                          <span>
                            £{exp.amount.toFixed(2)} on{" "}
                            {format(new Date(exp.date), "MMM d, yyyy")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Quick Add Expense Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsQuickAddOpen(true)}
              >
                <Receipt className="h-4 w-4 mr-2" />
                Create Expense from this Bill
              </Button>

              {/* Document Viewer */}
              <div className="flex-1 overflow-auto rounded-lg border min-h-[400px]">
                {selectedBill.fileType === "pdf" ? (
                  <iframe
                    src={selectedBill.url}
                    className="w-full h-full min-h-[400px]"
                    title={selectedBill.filename}
                  />
                ) : (
                  <img
                    src={selectedBill.url}
                    alt={selectedBill.filename}
                    className="w-full h-auto"
                  />
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Bill Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Bill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-filename">Filename</Label>
              <Input
                id="edit-filename"
                value={editData.filename}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, filename: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-type">Bill Type</Label>
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
                  {BILL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="mr-2">{type.icon}</span>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Total Amount (£)</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  value={editData.amount}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, amount: e.target.value }))
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

            <div className="space-y-2">
              <Label htmlFor="edit-period">Bill Period</Label>
              <Input
                id="edit-period"
                value={editData.billPeriod}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    billPeriod: e.target.value,
                  }))
                }
                placeholder="e.g., Jan 2025 - Dec 2025"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBill}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Expense Dialog */}
      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Expense from Bill</DialogTitle>
            <DialogDescription>
              Create a new expense linked to {selectedBill?.filename}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="exp-amount">Amount (£)</Label>
              <Input
                id="exp-amount"
                type="number"
                step="0.01"
                value={quickAddData.amount}
                onChange={(e) =>
                  setQuickAddData((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
                placeholder={
                  selectedBill?.monthlyAmount?.toString() ||
                  selectedBill?.amount?.toString() ||
                  "0.00"
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp-description">Description</Label>
              <Input
                id="exp-description"
                value={quickAddData.description}
                onChange={(e) =>
                  setQuickAddData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder={`${getBillTypeLabel(selectedBill?.billType)} payment`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp-date">Date</Label>
              <Input
                id="exp-date"
                type="date"
                value={quickAddData.date}
                onChange={(e) =>
                  setQuickAddData((prev) => ({ ...prev, date: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuickAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleQuickAddExpense}
              disabled={!quickAddData.amount}
            >
              Create & Link Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Bills;

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Receipt,
  Search,
  Calendar,
  Download,
  ExternalLink,
  Plus,
  Camera,
  Upload,
  Trash2,
  Loader2,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthContext";
import {
  useAllReceipts,
  useStandaloneReceipts,
  useGenerateUploadUrl,
  useCreateStandaloneReceipt,
  useDeleteStandaloneReceipt,
} from "@/hooks/useConvexData";
import { Id } from "../../convex/_generated/dataModel";
import { DEMO_MODE } from "@/lib/demoData";

type ExpenseReceipt = {
  _id: Id<"expenses">;
  type: "expense";
  amount: number;
  date: string;
  category: string;
  location: string;
  description?: string;
  paidByName: string;
  paidByImage: string;
  receiptUrl: string | null;
};

type StandaloneReceipt = {
  _id: Id<"receipts">;
  type: "standalone";
  title?: string;
  amount?: number;
  date: string;
  notes?: string;
  receiptUrl: string | null;
  uploadedByName: string;
  uploadedByImage: string;
};

type ReceiptItem = ExpenseReceipt | StandaloneReceipt;

const Receipts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "standalone">("all");
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ReceiptItem | null>(null);

  // Add receipt dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newReceipt, setNewReceipt] = useState({
    title: "",
    amount: "",
    notes: "",
    storageId: null as Id<"_storage"> | null,
    previewUrl: null as string | null,
  });

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const expenseReceipts = useAllReceipts();
  const standaloneReceipts = useStandaloneReceipts();
  const generateUploadUrl = useGenerateUploadUrl();
  const createStandaloneReceipt = useCreateStandaloneReceipt();
  const deleteStandaloneReceipt = useDeleteStandaloneReceipt();

  const isLoading =
    expenseReceipts === undefined || standaloneReceipts === undefined;

  // Combine and filter receipts
  const allReceipts = [
    ...(expenseReceipts || []),
    ...(standaloneReceipts || []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const displayReceipts =
    activeTab === "all" ? allReceipts : standaloneReceipts || [];

  const filteredReceipts = displayReceipts.filter((item) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    if (item.type === "expense") {
      return (
        item.category?.toLowerCase().includes(search) ||
        item.location?.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search) ||
        item.paidByName?.toLowerCase().includes(search)
      );
    } else {
      return (
        item.title?.toLowerCase().includes(search) ||
        item.notes?.toLowerCase().includes(search) ||
        item.amount?.toString().includes(search)
      );
    }
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) =>
        setNewReceipt((prev) => ({
          ...prev,
          previewUrl: e.target?.result as string,
        }));
      reader.readAsDataURL(file);

      // Upload to Convex
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) throw new Error("Upload failed");

      const { storageId } = await response.json();
      setNewReceipt((prev) => ({
        ...prev,
        storageId: storageId as Id<"_storage">,
      }));
      toast({ title: "Image uploaded", description: "Add details and save" });
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      setNewReceipt((prev) => ({ ...prev, previewUrl: null }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveReceipt = async () => {
    if (!newReceipt.storageId) {
      toast({
        title: "Error",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    try {
      await createStandaloneReceipt({
        storageId: newReceipt.storageId,
        title: newReceipt.title || undefined,
        amount: newReceipt.amount ? parseFloat(newReceipt.amount) : undefined,
        date: format(new Date(), "yyyy-MM-dd"),
        notes: newReceipt.notes || undefined,
        uploadedBy: user?._id as Id<"users"> | undefined,
      });

      toast({ title: "Success", description: "Receipt saved" });
      setIsAddDialogOpen(false);
      setNewReceipt({
        title: "",
        amount: "",
        notes: "",
        storageId: null,
        previewUrl: null,
      });
    } catch (error) {
      console.error("Error saving receipt:", error);
      toast({
        title: "Error",
        description: "Failed to save receipt",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStandalone = async (id: Id<"receipts">) => {
    if (!confirm("Delete this receipt?")) return;
    try {
      await deleteStandaloneReceipt({ id });
      toast({ title: "Deleted", description: "Receipt removed" });
      setSelectedReceipt(null);
      setSelectedItem(null);
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to delete",
        variant: "destructive",
      });
    }
  };

  const openReceiptViewer = (item: ReceiptItem) => {
    setSelectedItem(item);
    setSelectedReceipt(item.receiptUrl);
  };

  const downloadReceipt = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading receipts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Receipts</h1>
          <p className="text-muted-foreground">
            {allReceipts.length} receipt{allReceipts.length !== 1 ? "s" : ""}{" "}
            stored
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search receipts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} disabled={DEMO_MODE}>
            <Plus className="h-4 w-4 mr-2" />
            {DEMO_MODE ? "Add (disabled)" : "Add"}
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "all" | "standalone")}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="all">All ({allReceipts.length})</TabsTrigger>
          <TabsTrigger value="standalone">
            Standalone ({standaloneReceipts?.length || 0})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredReceipts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              {searchTerm ? "No receipts match your search" : "No receipts yet"}
            </p>
            {!searchTerm && (
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add your first receipt
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredReceipts.map((item) => (
            <Card
              key={item._id}
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
              onClick={() => openReceiptViewer(item)}
            >
              <div className="aspect-[3/4] relative bg-muted">
                {item.receiptUrl ? (
                  <img
                    src={item.receiptUrl}
                    alt="Receipt"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Receipt className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ExternalLink className="h-8 w-8 text-white" />
                </div>
                {item.type === "standalone" && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                    <FileText className="h-3 w-3" />
                  </div>
                )}
              </div>
              <CardContent className="p-3">
                {item.type === "expense" ? (
                  <>
                    <p className="font-semibold text-sm truncate">
                      £{item.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.category}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-sm truncate">
                      {item.title || "Untitled"}
                    </p>
                    {item.amount && (
                      <p className="text-xs text-muted-foreground">
                        £{item.amount.toFixed(2)}
                      </p>
                    )}
                  </>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(item.date), "MMM d, yyyy")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Receipt Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Receipt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {newReceipt.previewUrl ? (
              <div className="relative">
                <img
                  src={newReceipt.previewUrl}
                  alt="Preview"
                  className="w-full rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={() =>
                    setNewReceipt((prev) => ({
                      ...prev,
                      previewUrl: null,
                      storageId: null,
                    }))
                  }
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-24 flex-col gap-2"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6" />
                  )}
                  <span className="text-xs">Take Photo</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-24 flex-col gap-2"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Upload className="h-6 w-6" />
                  )}
                  <span className="text-xs">Upload</span>
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                placeholder="e.g., Grocery receipt"
                value={newReceipt.title}
                onChange={(e) =>
                  setNewReceipt((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (optional)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newReceipt.amount}
                onChange={(e) =>
                  setNewReceipt((prev) => ({ ...prev, amount: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                placeholder="Any additional notes..."
                value={newReceipt.notes}
                onChange={(e) =>
                  setNewReceipt((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveReceipt}
              disabled={!newReceipt.storageId}
            >
              Save Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Viewer Dialog */}
      <Dialog
        open={!!selectedReceipt}
        onOpenChange={() => {
          setSelectedReceipt(null);
          setSelectedItem(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Receipt Details</span>
              <div className="flex gap-2">
                {selectedReceipt && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadReceipt(
                        selectedReceipt,
                        `receipt-${selectedItem?._id}.jpg`,
                      )
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
                {selectedItem?.type === "standalone" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteStandalone(selectedItem._id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="flex flex-col gap-4 overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                {selectedItem.type === "expense" ? (
                  <>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={selectedItem.paidByImage} />
                        <AvatarFallback>
                          {selectedItem.paidByName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">
                          £{selectedItem.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedItem.category} • {selectedItem.location}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        {format(new Date(selectedItem.date), "MMM d, yyyy")}
                      </p>
                      {selectedItem.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-32">
                          {selectedItem.description}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="font-semibold">
                        {selectedItem.title || "Untitled Receipt"}
                      </p>
                      {selectedItem.amount && (
                        <p className="text-sm text-muted-foreground">
                          £{selectedItem.amount.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        {format(new Date(selectedItem.date), "MMM d, yyyy")}
                      </p>
                      {selectedItem.notes && (
                        <p className="text-xs text-muted-foreground truncate max-w-32">
                          {selectedItem.notes}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="flex-1 overflow-auto rounded-lg border">
                {selectedReceipt && (
                  <img
                    src={selectedReceipt}
                    alt="Receipt"
                    className="w-full h-auto"
                  />
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Receipts;

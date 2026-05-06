import { useState, useMemo } from "react";
import { FileText, X, Link, Check, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAllDocuments, useGetDocumentUrl } from "@/hooks/useConvexData";
import { Id } from "../../../convex/_generated/dataModel";
import { format } from "date-fns";

const DOCUMENT_TYPES = [
  { value: "all", label: "All" },
  { value: "bill", label: "Bills" },
  { value: "receipt", label: "Receipts" },
  { value: "warranty", label: "Warranties" },
  { value: "insurance", label: "Insurance" },
  { value: "certificate", label: "Certificates" },
  { value: "invoice", label: "Invoices" },
  { value: "other", label: "Other" },
];

const TYPE_LABELS: Record<string, string> = {
  bill: "Bill",
  receipt: "Receipt",
  warranty: "Warranty",
  insurance: "Insurance",
  certificate: "Certificate",
  invoice: "Invoice",
  other: "Other",
};

interface DocumentSelectorProps {
  linkedDocumentIds: Id<"documents">[];
  onLink: (documentId: Id<"documents">) => void;
  onUnlink: (documentId: Id<"documents">) => void;
}

type DocumentItem = {
  _id: Id<"documents">;
  type: string;
  url: string | null;
  date: string;
  amount?: number;
  title?: string;
  filename?: string;
  billType?: string;
  storageId: Id<"_storage">;
  linkedExpenseCount?: number;
  fileType?: string;
};

const DocumentSelector = ({
  linkedDocumentIds,
  onLink,
  onUnlink,
}: DocumentSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const allDocuments = useAllDocuments();

  const filteredDocuments = useMemo(() => {
    if (!allDocuments) return [];
    let docs = allDocuments;
    if (activeTab !== "all") {
      docs = docs.filter((d: DocumentItem) => d.type === activeTab);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      docs = docs.filter(
        (d: DocumentItem) =>
          (d.title || d.filename || "").toLowerCase().includes(term) ||
          (d.billType || "").toLowerCase().includes(term),
      );
    }
    return docs;
  }, [allDocuments, activeTab, searchTerm]);

  const linkedDocuments = linkedDocumentIds
    .map((id) => {
      const doc = allDocuments?.find((d: DocumentItem) => d._id === id);
      return doc ? { ...doc, id } : null;
    })
    .filter(Boolean) as (DocumentItem & { id: Id<"documents"> })[];

  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">
        Linked Documents{" "}
        <span className="text-muted-foreground font-normal">(optional)</span>
      </Label>

      {linkedDocuments.length > 0 ? (
        <div className="space-y-2">
          {linkedDocuments.map((doc) => (
            <LinkedDocumentItem
              key={doc.id}
              document={doc}
              onUnlink={() => onUnlink(doc.id)}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={() => setIsOpen(true)}
          >
            <Link className="h-4 w-4" />
            Link another document
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={() => setIsOpen(true)}
        >
          <Link className="h-4 w-4" />
          Link to existing documents
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Link Documents to Expense</DialogTitle>
            <DialogDescription>
              Select documents to link to this expense
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col min-h-0"
          >
            <TabsList className="grid grid-cols-4 sm:grid-cols-8 h-auto flex-wrap">
              {DOCUMENT_TYPES.map((t) => (
                <TabsTrigger key={t.value} value={t.value} className="text-xs">
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="flex-1 min-h-0 mt-4">
              {filteredDocuments?.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No documents found. Upload documents from the Documents page.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-1">
                  {filteredDocuments?.map((item: DocumentItem) => {
                    const isLinked = linkedDocumentIds.includes(item._id);
                    return (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => {
                          if (isLinked) {
                            onUnlink(item._id);
                          } else {
                            onLink(item._id);
                          }
                        }}
                        className={`relative text-left rounded-lg border overflow-hidden transition-all ${
                          isLinked
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border hover:border-muted-foreground/50"
                        }`}
                      >
                        <div className="aspect-[4/3] bg-muted relative">
                          {item.fileType === "pdf" ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-red-50">
                              <span className="text-2xl">📄</span>
                              <span className="text-xs text-red-600 font-medium mt-1">
                                PDF
                              </span>
                            </div>
                          ) : item.url ? (
                            <img
                              src={item.url}
                              alt="Document"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}

                          {isLinked && (
                            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                              <div className="bg-primary text-primary-foreground rounded-full p-2">
                                <Check className="h-4 w-4" />
                              </div>
                            </div>
                          )}

                          <Badge
                            variant="secondary"
                            className="absolute top-2 left-2 text-xs"
                          >
                            {TYPE_LABELS[item.type] || item.type}
                          </Badge>
                        </div>

                        <div className="p-2">
                          <p className="font-medium text-xs truncate">
                            {item.title || item.filename || "Untitled"}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(item.date), "MMM d")}
                            </span>
                            {item.amount && (
                              <span className="text-xs font-medium">
                                £{item.amount.toFixed(2)}
                              </span>
                            )}
                          </div>
                          {item.linkedExpenseCount !== undefined &&
                            item.linkedExpenseCount > 0 && (
                              <p className="text-xs text-green-600 mt-1">
                                {item.linkedExpenseCount} expense
                                {item.linkedExpenseCount !== 1 ? "s" : ""}{" "}
                                linked
                              </p>
                            )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const LinkedDocumentItem = ({
  document: doc,
  onUnlink,
}: {
  document: DocumentItem & { id: Id<"documents"> };
  onUnlink: () => void;
}) => {
  const docUrl = useGetDocumentUrl(doc.storageId);

  return (
    <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/30 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {docUrl ? (
            <ImageIcon className="h-4 w-4 text-primary" />
          ) : (
            <FileText className="h-4 w-4 text-primary" />
          )}
          <span className="font-medium text-sm truncate text-primary">
            {doc.title || doc.filename || TYPE_LABELS[doc.type] || "Document"}
          </span>
        </div>
        <p className="text-xs text-primary mt-0.5">
          {format(new Date(doc.date), "MMM d, yyyy")}
          {doc.amount && ` • £${doc.amount.toFixed(2)}`}
        </p>
      </div>
      {docUrl && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 text-primary"
          onClick={() => window.open(docUrl, "_blank")}
        >
          View
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-primary hover:text-red-600 hover:bg-red-50"
        onClick={onUnlink}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default DocumentSelector;

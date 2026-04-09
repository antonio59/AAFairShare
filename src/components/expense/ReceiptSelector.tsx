import { useState } from "react";
import { Receipt, X, Link, Check, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAllReceipts, useStandaloneReceipts, useGetReceiptUrl } from "@/hooks/useConvexData";
import { Id } from "../../../convex/_generated/dataModel";
import { format } from "date-fns";

interface ReceiptSelectorProps {
  linkedReceiptIds: Id<"receipts">[];
  onLink: (receiptId: Id<"receipts">) => void;
  onUnlink: (receiptId: Id<"receipts">) => void;
}

type ReceiptItem = {
  _id: Id<"receipts">;
  type: "expense" | "standalone";
  receiptUrl: string | null;
  date: string;
  amount?: number;
  category?: string;
  location?: string;
  description?: string;
  title?: string;
  paidByName?: string;
  uploadedByName?: string;
  receiptId?: Id<"_storage">;
  storageId: Id<"_storage">;
  linkedExpenseCount?: number;
};

const ReceiptSelector = ({ linkedReceiptIds, onLink, onUnlink }: ReceiptSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "standalone">("all");
  
  const allReceipts = useAllReceipts();
  const standaloneReceipts = useStandaloneReceipts();

  const displayReceipts = activeTab === "all" ? allReceipts : standaloneReceipts;

  const linkedReceipts = linkedReceiptIds.map(id => {
    const receipt = allReceipts?.find((r: ReceiptItem) => r._id === id);
    return receipt ? { ...receipt, id } : null;
  }).filter(Boolean) as (ReceiptItem & { id: Id<"receipts"> })[];

  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">
        Linked Receipts{" "}
        <span className="text-muted-foreground font-normal">(optional)</span>
      </Label>
      
      {linkedReceipts.length > 0 ? (
        <div className="space-y-2">
          {linkedReceipts.map((receipt) => (
            <LinkedReceiptItem 
              key={receipt.id} 
              receipt={receipt} 
              onUnlink={() => onUnlink(receipt.id)} 
            />
          ))}
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={() => setIsOpen(true)}
          >
            <Link className="h-4 w-4" />
            Link another receipt
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
          Link to existing receipts
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Link Receipts to Expense</DialogTitle>
            <DialogDescription>
              Select receipts to link to this expense
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "standalone")} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">
                All Receipts ({allReceipts?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="standalone">
                Standalone ({standaloneReceipts?.length || 0})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="flex-1 min-h-0 mt-4">
              {displayReceipts?.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No receipts found. Upload receipts from the Receipts page.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-1">
                  {displayReceipts?.map((item: ReceiptItem) => {
                    const isLinked = linkedReceiptIds.includes(item._id);
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
                            {item.type === "expense" ? "Expense" : "Standalone"}
                          </Badge>
                        </div>
                        
                        <div className="p-2">
                          <p className="font-medium text-xs truncate">
                            {item.type === "expense" 
                              ? `${item.category} • ${item.location}`
                              : item.title || "Untitled"
                            }
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
                          {item.linkedExpenseCount !== undefined && item.linkedExpenseCount > 0 && (
                            <p className="text-xs text-green-600 mt-1">
                              {item.linkedExpenseCount} expense{item.linkedExpenseCount !== 1 ? "s" : ""} linked
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

const LinkedReceiptItem = ({ 
  receipt, 
  onUnlink 
}: { 
  receipt: ReceiptItem & { id: Id<"receipts"> }; 
  onUnlink: () => void;
}) => {
  const receiptUrl = useGetReceiptUrl(receipt.storageId);

  return (
    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {receiptUrl ? (
            <ImageIcon className="h-4 w-4 text-blue-600" />
          ) : (
            <Receipt className="h-4 w-4 text-blue-600" />
          )}
          <span className="font-medium text-sm truncate text-blue-800">
            {receipt.title || receipt.description || receipt.category || "Linked Receipt"}
          </span>
        </div>
        <p className="text-xs text-blue-600 mt-0.5">
          {format(new Date(receipt.date), "MMM d, yyyy")}
          {receipt.amount && ` • £${receipt.amount.toFixed(2)}`}
        </p>
      </div>
      {receiptUrl && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 text-blue-700"
          onClick={() => window.open(receiptUrl, "_blank")}
        >
          View
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-blue-700 hover:text-red-600 hover:bg-red-50"
        onClick={onUnlink}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ReceiptSelector;

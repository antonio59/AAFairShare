import { useState, useEffect } from "react";
import { Building2, FileText, X, Link, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveAddresses, useBillsByAddress, useBillByExpense } from "@/hooks/useConvexData";
import { Id } from "../../../convex/_generated/dataModel";
import { format } from "date-fns";

interface BillSelectorProps {
  linkedBillId?: Id<"bills">;
  onLink: (billId: Id<"bills">) => void;
  onUnlink: () => void;
  expenseId?: Id<"expenses">; // For edit mode - to fetch current bill
}

const BILL_TYPE_LABELS: Record<string, string> = {
  "council-tax": "Council Tax",
  "electricity": "Electricity",
  "gas": "Gas",
  "water": "Water",
  "internet": "Internet",
  "insurance": "Insurance",
  "tv-license": "TV License",
  "service-charge": "Service Charge",
  "maintenance": "Maintenance",
  "receipt": "Receipt",
  "invoice": "Invoice",
  "other": "Other",
};

const BillSelector = ({ linkedBillId, onLink, onUnlink, expenseId }: BillSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<Id<"addresses"> | null>(null);
  const [selectedBillId, setSelectedBillId] = useState<Id<"bills"> | null>(null);
  
  const activeAddresses = useActiveAddresses();
  const billsByAddress = useBillsByAddress(selectedAddressId || undefined);
  const linkedBill = useBillByExpense(expenseId);

  // Use linkedBill from prop or fetched
  const currentBill = linkedBillId ? { _id: linkedBillId, ...(linkedBill || {}) } : linkedBill;

  useEffect(() => {
    if (activeAddresses?.length && !selectedAddressId) {
      setSelectedAddressId(activeAddresses[0]._id);
    }
  }, [activeAddresses, selectedAddressId]);

  const handleLink = () => {
    if (selectedBillId) {
      onLink(selectedBillId);
      setIsOpen(false);
      setSelectedBillId(null);
    }
  };

  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">
        Linked Bill{" "}
        <span className="text-muted-foreground font-normal">(optional)</span>
      </Label>
      
      {currentBill?._id ? (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-600" />
              <span className="font-medium text-sm truncate text-green-800">
                {(currentBill as {filename?: string}).filename || "Linked Bill"}
              </span>
            </div>
            {(currentBill as {billType?: string}).billType && (
              <p className="text-xs text-green-600 mt-0.5">
                {BILL_TYPE_LABELS[(currentBill as {billType?: string}).billType!] || (currentBill as {billType?: string}).billType}
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-green-700 hover:text-red-600 hover:bg-red-50"
            onClick={onUnlink}
          >
            <X className="h-4 w-4" />
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
          Link to a bill
        </Button>
      )}

      {/* Bill Selection Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Link Expense to Bill</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Address Selection */}
            <div className="space-y-2">
              <Label>Select Address</Label>
              <Select
                value={selectedAddressId || ""}
                onValueChange={(value) => {
                  setSelectedAddressId(value as Id<"addresses">);
                  setSelectedBillId(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an address" />
                </SelectTrigger>
                <SelectContent>
                  {activeAddresses?.map((address) => (
                    <SelectItem key={address._id} value={address._id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span className="truncate">{address.name}</span>
                        <Badge variant="secondary" className="ml-1">{address.billCount}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bill Selection */}
            {selectedAddressId && (
              <div className="space-y-2">
                <Label>Select Bill</Label>
                {billsByAddress?.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No bills for this address. Upload bills first.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {billsByAddress?.map((bill) => (
                      <button
                        key={bill._id}
                        type="button"
                        onClick={() => setSelectedBillId(bill._id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedBillId === bill._id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {selectedBillId === bill._id ? (
                              <Check className="h-4 w-4 text-primary" />
                            ) : (
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{bill.filename}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {bill.billType && (
                                <Badge variant="secondary" className="text-xs">
                                  {BILL_TYPE_LABELS[bill.billType] || bill.billType}
                                </Badge>
                              )}
                              {bill.monthlyAmount ? (
                                <span className="text-xs text-green-600">
                                  £{bill.monthlyAmount.toFixed(2)}/mo
                                </span>
                              ) : bill.amount ? (
                                <span className="text-xs text-muted-foreground">
                                  £{bill.amount.toFixed(2)}
                                </span>
                              ) : null}
                            </div>
                            {bill.linkedExpenseCount > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {bill.linkedExpenseCount} expense{bill.linkedExpenseCount !== 1 ? "s" : ""} linked
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLink} disabled={!selectedBillId}>
              Link Bill
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillSelector;

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Receipt, Search, Calendar, X, Download, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useAllReceipts } from "@/hooks/useConvexData";

const Receipts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  
  const receipts = useAllReceipts();
  const isLoading = receipts === undefined;

  const filteredReceipts = receipts?.filter((exp) => {
    const search = searchTerm.toLowerCase();
    return (
      exp.category.toLowerCase().includes(search) ||
      exp.location.toLowerCase().includes(search) ||
      exp.description?.toLowerCase().includes(search) ||
      exp.paidByName.toLowerCase().includes(search)
    );
  });

  const openReceiptViewer = (expense: any) => {
    setSelectedExpense(expense);
    setSelectedReceipt(expense.receiptUrl);
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
            {receipts?.length || 0} receipt{receipts?.length !== 1 ? "s" : ""} stored
          </p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search receipts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {!receipts || receipts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No receipts yet</p>
            <p className="text-sm text-muted-foreground">
              Add receipts when creating expenses to see them here
            </p>
          </CardContent>
        </Card>
      ) : filteredReceipts?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No receipts match your search</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredReceipts?.map((expense) => (
            <Card 
              key={expense._id} 
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
              onClick={() => openReceiptViewer(expense)}
            >
              <div className="aspect-[3/4] relative bg-muted">
                {expense.receiptUrl ? (
                  <img
                    src={expense.receiptUrl}
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
              </div>
              <CardContent className="p-3">
                <p className="font-semibold text-sm truncate">£{expense.amount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground truncate">{expense.category}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(expense.date), "MMM d, yyyy")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Receipt Viewer Dialog */}
      <Dialog open={!!selectedReceipt} onOpenChange={() => { setSelectedReceipt(null); setSelectedExpense(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Receipt Details</span>
              {selectedReceipt && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadReceipt(selectedReceipt, `receipt-${selectedExpense?._id}.jpg`)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedExpense && (
            <div className="flex flex-col gap-4 overflow-hidden">
              {/* Expense Info */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedExpense.paidByImage} />
                    <AvatarFallback>{selectedExpense.paidByName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">£{selectedExpense.amount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedExpense.category} • {selectedExpense.location}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm">{format(new Date(selectedExpense.date), "MMM d, yyyy")}</p>
                  {selectedExpense.description && (
                    <p className="text-xs text-muted-foreground truncate max-w-32">
                      {selectedExpense.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Receipt Image */}
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

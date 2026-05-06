import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Expense } from "@/types";
import { format } from "date-fns";
import { FileText, ExternalLink, X } from "lucide-react";
import { useDocumentsByExpense } from "@/hooks/useConvexData";
import { Id } from "../../../convex/_generated/dataModel";

interface ViewExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense;
  onEdit: () => void;
}

export default function ViewExpenseDialog({ isOpen, onClose, expense, onEdit }: ViewExpenseDialogProps) {
  const linkedDocs = useDocumentsByExpense(expense.id as Id<"expenses">);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Expense Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-foreground">
              £{expense.amount.toFixed(2)}
            </span>
            <Badge variant="secondary">{expense.split}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-medium">{format(new Date(expense.date), "MMM d, yyyy")}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Category</p>
              <p className="font-medium">{expense.category}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Location</p>
              <p className="font-medium">{expense.location}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Paid By</p>
              <p className="font-medium">{expense.paidBy}</p>
            </div>
          </div>

          {expense.description && (
            <div>
              <p className="text-muted-foreground text-sm">Description</p>
              <p className="font-medium">{expense.description}</p>
            </div>
          )}

          {linkedDocs && linkedDocs.length > 0 && (
            <div>
              <p className="text-muted-foreground text-sm mb-2">Linked Documents ({linkedDocs.length})</p>
              <div className="space-y-2">
                {linkedDocs.map((doc: any) => (
                  <div key={doc._id} className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                    {doc.url && doc.fileType === "image" ? (
                      <img src={doc.url} alt="" className="w-10 h-10 rounded object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.title || `${doc.type} document`}</p>
                      <p className="text-xs text-muted-foreground">{doc.type}</p>
                    </div>
                    {doc.url && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button onClick={onEdit} className="flex-1">Edit</Button>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

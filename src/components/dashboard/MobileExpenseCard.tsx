import { useState } from "react";
import { Expense } from "@/types";
import { format } from "date-fns";
import { useUpdateExpense, useDeleteExpense } from "@/hooks/useConvexData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthContext";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import EditExpenseDialog from "./expense-row/EditExpenseDialog";
import DeleteExpenseDialog from "./expense-row/DeleteExpenseDialog";

interface MobileExpenseCardProps {
  expense: Expense;
}

const MobileExpenseCard = ({ expense }: MobileExpenseCardProps) => {
  const { users = [] } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedExpense, setEditedExpense] = useState<Expense>(expense);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const updateExpense = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  const paidByUser = users.find(u => u.id === expense.paidBy);

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      await updateExpense({
        id: expense.id as Id<"expenses">,
        amount: editedExpense.amount,
        date: editedExpense.date,
        description: editedExpense.description,
        splitType: editedExpense.split,
      });
      setIsEditing(false);
      toast({ title: "Expense updated" });
    } catch {
      toast({ title: "Error", description: "Failed to update expense.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      await deleteExpenseMutation({ id: expense.id as Id<"expenses"> });
      setIsDeleting(false);
      toast({ title: "Expense deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete expense.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="mb-3">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold">£{expense.amount.toFixed(2)}</p>
              <p className="text-sm text-gray-500">{expense.category} • {expense.location}</p>
              <p className="text-xs text-gray-400">{format(new Date(expense.date), "MMM d, yyyy")}</p>
              {expense.description && <p className="text-sm mt-1">{expense.description}</p>}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => { setEditedExpense({...expense}); setIsEditing(true); }}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => setIsDeleting(true)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Paid by: {paidByUser?.username || "Unknown"}</p>
        </CardContent>
      </Card>
      <EditExpenseDialog isOpen={isEditing} onClose={() => setIsEditing(false)} expense={editedExpense} setExpense={setEditedExpense} onSave={handleSave} isSubmitting={isSubmitting} />
      <DeleteExpenseDialog isOpen={isDeleting} onClose={() => setIsDeleting(false)} onConfirm={handleDelete} isSubmitting={isSubmitting} />
    </>
  );
};

export default MobileExpenseCard;

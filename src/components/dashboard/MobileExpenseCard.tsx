import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";
import { Expense, User } from "@/types";
import { updateExpense, deleteExpense } from "@/services/expenseService";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import EditExpenseDialog from "./expense-row/EditExpenseDialog";
import DeleteExpenseDialog from "./expense-row/DeleteExpenseDialog";

interface MobileExpenseCardProps {
  expense: Expense;
  paidByUser: User; // User who paid for this expense
}

const MobileExpenseCard = ({ expense, paidByUser }: MobileExpenseCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedExpense, setEditedExpense] = useState<Expense>(expense);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleEdit = () => {
    setEditedExpense({ ...expense });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      await updateExpense(expense.id, {
        ...editedExpense,
        paidBy: expense.paidBy, // Keep original paidBy
      });
      
      // Wait for query invalidation to complete before closing dialog
      await queryClient.invalidateQueries({ queryKey: ["monthData"] });
      
      setIsEditing(false);
      toast({
        title: "Expense updated",
        description: "Your expense has been updated successfully.",
      });
    } catch (error) {
      console.error("Failed to update expense:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating the expense.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedExpense(expense);
  };

  const openDeleteDialog = () => {
    setIsDeleting(true);
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      await deleteExpense(expense.id);
      
      // Wait for query invalidation to complete before closing dialog
      await queryClient.invalidateQueries({ queryKey: ["monthData"] });
      
      setIsDeleting(false);
      toast({
        title: "Expense deleted",
        description: "Your expense has been deleted successfully.",
      });
    } catch (error) {
      console.error("Failed to delete expense:", error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting the expense.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white p-4 rounded-xl border mb-3 shadow-sm active:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="font-semibold text-base mb-1">{expense.category}</div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span>📍</span>
              <span>{expense.location}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-lg text-primary">£{expense.amount.toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-0.5">{expense.split === "50/50" ? "Split" : expense.split}</div>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-600 mb-3 pb-3 border-b">
          <div className="flex items-center gap-1">
            <span>📅</span>
            <span>{format(new Date(expense.date), "MMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Paid by</span>
            <span className="font-medium">{paidByUser.username}</span>
          </div>
        </div>
        {expense.description && (
          <div className="text-sm text-gray-700 mb-3 italic">"{expense.description}"</div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleEdit} 
            className="h-9 px-4 text-xs gap-1.5"
            aria-label="Edit expense"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Edit</span>
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-9 px-4 text-xs gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" 
            onClick={openDeleteDialog}
            aria-label="Delete expense"
          >
            <Trash className="h-3.5 w-3.5" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      <EditExpenseDialog
        isOpen={isEditing}
        onClose={handleCancelEdit}
        expense={expense} // Original expense for context, e.g. who paid
        editedExpense={editedExpense} // The expense being edited
        setEditedExpense={setEditedExpense}
        user={paidByUser} // The user who originally paid, passed for display/context in dialog
        isSubmitting={isSubmitting}
        handleSave={handleSave}
      />

      <DeleteExpenseDialog
        isOpen={isDeleting}
        onClose={() => setIsDeleting(false)}
        onDelete={handleDelete}
        isSubmitting={isSubmitting}
      />
    </>
  );
};

export default MobileExpenseCard;

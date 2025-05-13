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
      setIsEditing(false);
      toast({
        title: "Expense updated",
        description: "Your expense has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["monthData"] });
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
      setIsDeleting(false);
      toast({
        title: "Expense deleted",
        description: "Your expense has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["monthData"] });
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
      <div className="bg-white p-3 rounded-lg border mb-3 shadow-sm">
        <div className="flex justify-between items-start mb-1.5">
          <div>
            <div className="font-medium text-sm">{expense.category}</div>
            <div className="text-xs text-gray-500">{expense.location}</div>
          </div>
          <div className="font-bold text-sm">£{expense.amount.toFixed(2)}</div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <div>{format(new Date(expense.date), "MMM d, yyyy")}</div>
          <div>Paid by: {paidByUser.username}</div>
        </div>
        {expense.description && (
          <div className="text-xs mb-2 text-gray-600">{expense.description}</div>
        )}
        <div className="flex justify-end gap-2 mt-2">
          <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-auto" onClick={handleEdit}>
            <Pencil className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button size="sm" variant="outline" className="text-red-500 text-xs px-2 py-1 h-auto" onClick={openDeleteDialog}>
            <Trash className="h-3 w-3 mr-1" />
            Delete
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

import { useState } from "react";
import { Expense } from "@/types";
import { format } from "date-fns";
import { useUpdateExpense, useDeleteExpense } from "@/hooks/useConvexData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthContext";
import { Id } from "../../../convex/_generated/dataModel";
import UserAvatar from "./expense-row/UserAvatar";
import ExpenseRowActions from "./expense-row/ExpenseRowActions";
import EditExpenseDialog from "./expense-row/EditExpenseDialog";
import DeleteExpenseDialog from "./expense-row/DeleteExpenseDialog";

interface ExpenseTableRowProps {
  expense: Expense;
}

const ExpenseTableRow = ({ expense }: ExpenseTableRowProps) => {
  const { users: authUsersList = [] } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedExpense, setEditedExpense] = useState<Expense>(expense);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const updateExpense = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  const handleEdit = () => {
    setEditedExpense({...expense});
    setIsEditing(true);
  };

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
      toast({ title: "Expense updated", description: "Your expense has been updated successfully." });
    } catch (error) {
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
      toast({ title: "Expense deleted", description: "Your expense has been deleted." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete expense.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const paidByUser = authUsersList.find(u => u.id === expense.paidBy || u._id === expense.paidBy);

  return (
    <>
      <tr className="border-b hover:bg-gray-50">
        <td className="py-3 px-4">{format(new Date(expense.date), "MMM d, yyyy")}</td>
        <td className="py-3 px-4">
          <div className="font-medium">{expense.category}</div>
          <div className="text-sm text-gray-500">{expense.location}</div>
        </td>
        <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{expense.description || "-"}</td>
        <td className="py-3 px-4 font-medium">£{expense.amount.toFixed(2)}</td>
        <td className="py-3 px-4"><UserAvatar user={paidByUser || { id: expense.paidBy, username: "Unknown", email: "" }} /></td>
        <td className="py-3 px-4 text-sm text-gray-500">{expense.split}</td>
        <td className="py-3 px-4"><ExpenseRowActions onEdit={handleEdit} onDelete={() => setIsDeleting(true)} /></td>
      </tr>
      <EditExpenseDialog isOpen={isEditing} onClose={() => setIsEditing(false)} expense={editedExpense} setExpense={setEditedExpense} onSave={handleSave} isSubmitting={isSubmitting} />
      <DeleteExpenseDialog isOpen={isDeleting} onClose={() => setIsDeleting(false)} onConfirm={handleDelete} isSubmitting={isSubmitting} />
    </>
  );
};

export default ExpenseTableRow;

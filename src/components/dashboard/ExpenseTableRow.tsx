import { useState } from "react";
import { Expense } from "@/types";
import { format } from "date-fns";
import { useUpdateExpense, useDeleteExpense } from "@/hooks/useConvexData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthContext";
import { Id } from "../../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
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
  const userName = paidByUser?.username || "Unknown";
  const userAvatar = paidByUser?.avatar || "";

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3 text-sm text-gray-600">
          {format(new Date(expense.date), "MMM d, yyyy")}
        </td>
        <td className="px-4 py-3 text-sm font-medium text-gray-900 break-words max-w-[140px]">
          {expense.category}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 break-words max-w-[140px]">
          {expense.location}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 whitespace-pre-wrap break-words max-w-[220px]">
          {expense.description || <span className="text-gray-300">—</span>}
        </td>
        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
          £{expense.amount.toFixed(2)}
        </td>
        <td className="px-4 py-3 text-center">
          <Avatar className="h-7 w-7 mx-auto">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback className="text-xs">{userName.charAt(0)}</AvatarFallback>
          </Avatar>
        </td>
        <td className="px-4 py-3 text-center">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            {expense.split}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex justify-center gap-1">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleEdit}
              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setIsDeleting(true)}
              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>
      <EditExpenseDialog 
        isOpen={isEditing} 
        onClose={() => setIsEditing(false)} 
        expense={editedExpense} 
        setExpense={setEditedExpense} 
        onSave={handleSave} 
        isSubmitting={isSubmitting} 
      />
      <DeleteExpenseDialog 
        isOpen={isDeleting} 
        onClose={() => setIsDeleting(false)} 
        onConfirm={handleDelete} 
        isSubmitting={isSubmitting} 
      />
    </>
  );
};

export default ExpenseTableRow;

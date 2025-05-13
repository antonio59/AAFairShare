import { useState } from "react";
import { format } from "date-fns";
import { Pencil, Trash, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { deleteRecurringExpense, generateExpenseFromRecurring } from "@/services/expenseService";
import { RecurringExpense, User } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import EditRecurringExpenseForm from "./EditRecurringExpenseForm";

interface RecurringExpenseRowProps {
  expense: RecurringExpense;
  user: User;
  onRefresh: () => void;
}

const RecurringExpenseRow = ({ expense, user, onRefresh }: RecurringExpenseRowProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      await deleteRecurringExpense(expense.id);
      setIsDeleting(false);
      toast({
        title: "Recurring expense deleted",
        description: "The recurring expense has been deleted successfully.",
      });
      onRefresh();
    } catch (error) {
      console.error("Failed to delete recurring expense:", error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting this recurring expense.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateExpense = async () => {
    try {
      setIsSubmitting(true);
      await generateExpenseFromRecurring(expense.id);
      toast({
        title: "Expense generated",
        description: "An expense has been created from this recurring expense.",
      });
      onRefresh();
    } catch (error) {
      console.error("Failed to generate expense:", error);
      toast({
        title: "Generation failed",
        description: "There was an error creating an expense.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFrequency = (freq: string) => {
    return freq.charAt(0).toUpperCase() + freq.slice(1);
  };

  return (
    <>
      <tr className="hover:bg-gray-50 text-sm">
        <td className="px-2 py-3 sm:px-4">
          {format(new Date(expense.nextDueDate), "MMM d, yyyy")}
        </td>
        <td className="px-2 py-3 sm:px-4">
          <div className="font-medium">{expense.category}</div>
          <div className="text-xs sm:text-sm text-gray-500">{expense.location}</div>
        </td>
        <td className="px-2 py-3 sm:px-4 text-gray-500">
          {formatFrequency(expense.frequency)}
        </td>
        <td className="px-2 py-3 sm:px-4 font-medium">
          £{expense.amount.toFixed(2)}
        </td>
        <td className="px-2 py-3 sm:px-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
              <AvatarImage src={user.avatar} alt={user.username} />
              <AvatarFallback>{user.username?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
            </Avatar>
            <span>{user.username}</span>
          </div>
        </td>
        <td className="px-2 py-3 sm:px-4 text-gray-500">
          {expense.description || "-"}
        </td>
        <td className="px-2 py-3 sm:px-4">
          <div className="flex gap-1 sm:gap-2">
            <Button size="sm" variant="ghost" onClick={handleGenerateExpense} disabled={isSubmitting} title="Create expense now" className="p-1 sm:p-2">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} className="p-1 sm:p-2">
              <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 p-1 sm:p-2" onClick={() => setIsDeleting(true)}>
              <Trash className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </td>
      </tr>

      {/* Edit Dialog */}
      <EditRecurringExpenseForm 
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSuccess={onRefresh}
        recurringExpense={expense}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this recurring expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the recurring expense.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RecurringExpenseRow;

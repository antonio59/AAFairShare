import { useState } from "react";
import { Expense } from "@/types";
import { format } from "date-fns";
import { useUpdateExpense, useDeleteExpense } from "@/hooks/useConvexData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthContext";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pencil, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  const paidByUser = users.find(u => u.id === expense.paidBy || u._id === expense.paidBy);
  const userName = paidByUser?.username || paidByUser?.name || "Unknown";
  const userAvatar = paidByUser?.photoUrl || paidByUser?.image || "";

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
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold">£{expense.amount.toFixed(2)}</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  {expense.split}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900">{expense.category}</p>
              <p className="text-sm text-gray-500">{expense.location}</p>
              {expense.description && (
                <p className="text-sm text-gray-400 mt-1 truncate">{expense.description}</p>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={userAvatar} alt={userName} />
                    <AvatarFallback className="text-xs">{userName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-gray-500">{userName}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {format(new Date(expense.date), "MMM d, yyyy")}
                </span>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setEditedExpense({...expense}); setIsEditing(true); }}>
                  <Pencil className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsDeleting(true)} className="text-red-500">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
      <EditExpenseDialog isOpen={isEditing} onClose={() => setIsEditing(false)} expense={editedExpense} setExpense={setEditedExpense} onSave={handleSave} isSubmitting={isSubmitting} />
      <DeleteExpenseDialog isOpen={isDeleting} onClose={() => setIsDeleting(false)} onConfirm={handleDelete} isSubmitting={isSubmitting} />
    </>
  );
};

export default MobileExpenseCard;

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useDeleteRecurringExpense, useGenerateExpenseFromRecurring } from "@/hooks/useConvexData";
import { RecurringExpense, User } from "@/types";
import { Id } from "../../../convex/_generated/dataModel";
import { Pencil, Trash2, Play, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import EditRecurringExpenseForm from "./EditRecurringExpenseForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface RecurringExpenseRowProps {
  expense: RecurringExpense;
  user: User;
  onRefresh: () => void;
}

const RecurringExpenseRow = ({ expense, user, onRefresh }: RecurringExpenseRowProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const deleteRecurring = useDeleteRecurringExpense();
  const generateExpense = useGenerateExpenseFromRecurring();

  const handleDelete = async () => {
    try {
      await deleteRecurring({ id: expense.id as Id<"recurring"> });
      toast({ title: "Deleted", description: "Recurring expense removed." });
      setIsDeleting(false);
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateExpense({ id: expense.id as Id<"recurring"> });
      toast({ title: "Success", description: "Expense generated and next due date updated." });
    } catch {
      toast({ title: "Error", description: "Failed to generate expense.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const isEnded = expense.status === "ended";

  return (
    <>
      <tr className={`border-b ${isEnded ? "opacity-60" : ""}`}>
        <td className="px-4 py-3">{format(new Date(expense.nextDueDate), "MMM d, yyyy")}</td>
        <td className="px-4 py-3">{expense.category}<br/><span className="text-xs text-gray-500">{expense.location}</span></td>
        <td className="px-4 py-3 capitalize">{expense.frequency}</td>
        <td className="px-4 py-3 font-medium">£{expense.amount.toFixed(2)}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6"><AvatarImage src={user.avatar} /><AvatarFallback>{user.username?.charAt(0)}</AvatarFallback></Avatar>
            <span className="text-sm">{user.username}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-gray-500">{expense.description}</td>
        <td className="px-4 py-3">
          <div className="flex gap-1">
            {!isEnded && (
              <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={isGenerating} title="Generate expense">
                <Play className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => setIsDeleting(true)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
          </div>
        </td>
      </tr>
      <EditRecurringExpenseForm isOpen={isEditing} onClose={() => setIsEditing(false)} expense={expense} onSuccess={onRefresh} />
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Recurring Expense?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RecurringExpenseRow;

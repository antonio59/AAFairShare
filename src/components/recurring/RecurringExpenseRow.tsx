import { useState } from "react";
import { formatCurrency } from "@/lib/money";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  useDeleteRecurringExpense,
  useGenerateExpenseFromRecurring,
} from "@/hooks/useConvexData";
import { RecurringExpense, User } from "@/types";
import { Id } from "../../../convex/_generated/dataModel";
import { Pencil, Trash2, Play, Paperclip } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import EditRecurringExpenseForm from "./EditRecurringExpenseForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RecurringExpenseRowProps {
  expense: RecurringExpense;
  user: User;
  onRefresh: () => void;
  /** "row" renders a <tr> for desktop tables; "card" renders a mobile card */
  variant?: "row" | "card";
}

const RecurringExpenseRow = ({
  expense,
  user,
  onRefresh,
  variant = "row",
}: RecurringExpenseRowProps) => {
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
      toast({
        title: "Error",
        description: "Failed to delete.",
        variant: "destructive",
      });
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateExpense({ id: expense.id as Id<"recurring"> });
      toast({
        title: "Success",
        description: "Expense generated and next due date updated.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to generate expense.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const isEnded = expense.status === "ended";
  const formattedDueDate = (() => {
    const [y, m, d] = expense.nextDueDate.split("-").map(Number);
    return format(new Date(y, m - 1, d), "MMM d, yyyy");
  })();

  const actionButtons = (
    <div className="flex gap-1">
      {!isEnded && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGenerate}
          disabled={isGenerating}
          title="Generate expense"
          aria-label="Generate expense from recurring"
        >
          <Play className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsEditing(true)}
        aria-label="Edit recurring expense"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsDeleting(true)}
        aria-label="Delete recurring expense"
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );

  const dialogs = (
    <>
      <EditRecurringExpenseForm
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        expense={expense}
        onSuccess={onRefresh}
      />
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recurring Expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  if (variant === "card") {
    return (
      <>
        <div
          className={`bg-card rounded-lg border border-border p-4 space-y-3 ${isEnded ? "opacity-60" : ""}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-lg font-semibold">
                {formatCurrency(expense.amount)}
                <span className="ml-2 text-xs font-normal text-muted-foreground capitalize">
                  {expense.frequency}
                </span>
              </p>
              <p className="text-sm truncate">
                {expense.category}
                <span className="text-muted-foreground"> · {expense.location}</span>
              </p>
              {expense.description && (
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  {expense.description}
                  {expense.linkedDocumentIds && expense.linkedDocumentIds.length > 0 && (
                    <span className="inline-flex items-center gap-0.5" title={`${expense.linkedDocumentIds.length} document(s) attached`}>
                      <Paperclip className="h-3 w-3" />
                      {expense.linkedDocumentIds.length}
                    </span>
                  )}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.username?.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Next due {formattedDueDate}
            </span>
            {actionButtons}
          </div>
        </div>
        {dialogs}
      </>
    );
  }

  return (
    <>
      <tr className={`border-b ${isEnded ? "opacity-60" : ""}`}>
        <td className="px-4 py-3">{formattedDueDate}</td>
        <td className="px-4 py-3">
          {expense.category}
          <br />
          <span className="text-xs text-muted-foreground">
            {expense.location}
          </span>
        </td>
        <td className="px-4 py-3 capitalize">{expense.frequency}</td>
        <td className="px-4 py-3 font-medium">{formatCurrency(expense.amount)}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user.username?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{user.username}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-muted-foreground">
          <div className="flex items-center gap-2">
            {expense.description}
            {expense.linkedDocumentIds && expense.linkedDocumentIds.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title={`${expense.linkedDocumentIds.length} document(s) attached`}>
                <Paperclip className="h-3 w-3" />
                {expense.linkedDocumentIds.length}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3">{actionButtons}</td>
      </tr>
      {dialogs}
    </>
  );
};

export default RecurringExpenseRow;

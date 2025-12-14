import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUpdateRecurringExpense } from "@/hooks/useConvexData";
import { RecurringExpense } from "@/types";
import { Id } from "../../../convex/_generated/dataModel";
import AmountInput from "@/components/expense/AmountInput";
import DateSelector from "@/components/expense/DateSelector";
import CategorySelector from "@/components/expense/CategorySelector";
import LocationSelector from "@/components/expense/LocationSelector";
import SplitTypeSelector from "@/components/expense/SplitTypeSelector";
import FrequencySelector from "@/components/recurring/FrequencySelector";
import UserSelector from "@/components/recurring/UserSelector";

interface EditRecurringExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  expense: RecurringExpense;
  onSuccess: () => void;
}

const EditRecurringExpenseForm = ({
  isOpen,
  onClose,
  expense,
  onSuccess,
}: EditRecurringExpenseFormProps) => {
  const { toast } = useToast();
  const updateRecurring = useUpdateRecurringExpense();

  const [formData, setFormData] = useState({
    amount: "",
    nextDueDate: new Date(),
    category: "",
    location: "",
    description: "",
    frequency: "",
    splitType: "50/50",
    userId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (expense) {
      setFormData({
        amount: expense.amount.toString(),
        nextDueDate: new Date(expense.nextDueDate),
        category: expense.category,
        location: expense.location,
        description: expense.description || "",
        frequency: expense.frequency,
        splitType: expense.splitType || "50/50",
        userId: expense.user?._id || "",
      });
    }
  }, [expense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.category) {
      toast({
        title: "Missing fields",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Format date as YYYY-MM-DD string
      const dateString = formData.nextDueDate.toISOString().split("T")[0];

      await updateRecurring({
        id: expense.id as Id<"recurring">,
        amount: parseFloat(formData.amount),
        nextDueDate: dateString,
        categoryName: formData.category,
        locationName: formData.location || "Other",
        description: formData.description || undefined,
        frequency: formData.frequency,
        splitType: formData.splitType,
        userId: formData.userId ? (formData.userId as Id<"users">) : undefined,
      });
      toast({ title: "Success", description: "Recurring expense updated." });
      onSuccess();
      onClose();
    } catch {
      toast({
        title: "Error",
        description: "Failed to update recurring expense.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Recurring Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Amount & Next Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AmountInput
              value={formData.amount}
              onChange={(value) => setFormData({ ...formData, amount: value })}
            />
            <DateSelector
              label="Next Due Date"
              selectedDate={formData.nextDueDate}
              onChange={(date) =>
                date && setFormData({ ...formData, nextDueDate: date })
              }
            />
          </div>

          {/* Category */}
          <CategorySelector
            selectedCategory={formData.category}
            onChange={(category) => setFormData({ ...formData, category })}
          />

          {/* Location */}
          <LocationSelector
            selectedLocation={formData.location}
            onChange={(location) => setFormData({ ...formData, location })}
          />

          {/* Frequency */}
          <FrequencySelector
            selectedFrequency={formData.frequency}
            onChange={(frequency) => setFormData({ ...formData, frequency })}
          />

          {/* Split Type */}
          <SplitTypeSelector
            selectedSplitType={formData.splitType}
            onChange={(splitType) => setFormData({ ...formData, splitType })}
          />

          {/* Paid By */}
          <UserSelector
            selectedUserId={formData.userId}
            onChange={(userId) => setFormData({ ...formData, userId })}
          />

          {/* Description */}
          <div>
            <Label
              htmlFor="edit-recurring-description"
              className="text-sm font-medium mb-2 block"
            >
              Description{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="edit-recurring-description"
              placeholder="Add notes about this recurring expense"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditRecurringExpenseForm;

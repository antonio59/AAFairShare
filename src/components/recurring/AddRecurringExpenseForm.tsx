import { useState } from "react";
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
import { useCreateRecurringExpense } from "@/hooks/useConvexData";
import { useAuth } from "@/providers/AuthContext";
import { Id } from "../../../convex/_generated/dataModel";
import AmountInput from "@/components/expense/AmountInput";
import DateSelector from "@/components/expense/DateSelector";
import CategorySelector from "@/components/expense/CategorySelector";
import LocationSelector from "@/components/expense/LocationSelector";
import SplitTypeSelector from "@/components/expense/SplitTypeSelector";
import FrequencySelector from "@/components/recurring/FrequencySelector";
import UserSelector from "@/components/recurring/UserSelector";

interface AddRecurringExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddRecurringExpenseForm = ({
  isOpen,
  onClose,
  onSuccess,
}: AddRecurringExpenseFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const createRecurring = useCreateRecurringExpense();

  const [formData, setFormData] = useState({
    amount: "",
    nextDueDate: new Date(),
    category: "",
    location: "",
    description: "",
    userId: user?._id || "",
    frequency: "monthly",
    splitType: "50/50",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      amount: "",
      nextDueDate: new Date(),
      category: "",
      location: "",
      description: "",
      userId: user?._id || "",
      frequency: "monthly",
      splitType: "50/50",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.category || !formData.userId) {
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

      await createRecurring({
        amount: parseFloat(formData.amount),
        nextDueDate: dateString,
        categoryName: formData.category,
        locationName: formData.location || "Other",
        description: formData.description || undefined,
        userId: formData.userId as Id<"users">,
        frequency: formData.frequency,
        splitType: formData.splitType,
      });
      toast({ title: "Success", description: "Recurring expense added." });
      onSuccess();
      onClose();
      resetForm();
    } catch {
      toast({
        title: "Error",
        description: "Failed to add recurring expense.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Recurring Expense</DialogTitle>
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
              htmlFor="recurring-description"
              className="text-sm font-medium mb-2 block"
            >
              Description{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="recurring-description"
              placeholder="Add notes about this recurring expense"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Recurring"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRecurringExpenseForm;

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
import CategorySelector from "@/components/expense/CategorySelector";
import LocationSelector from "@/components/expense/LocationSelector";
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
    nextDueDate: new Date().toISOString().split("T")[0],
    category: "",
    location: "",
    description: "",
    userId: user?._id || "",
    frequency: "monthly",
    splitType: "50/50",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      await createRecurring({
        amount: parseFloat(formData.amount),
        nextDueDate: formData.nextDueDate,
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
      setFormData({
        amount: "",
        nextDueDate: new Date().toISOString().split("T")[0],
        category: "",
        location: "",
        description: "",
        userId: user?._id || "",
        frequency: "monthly",
        splitType: "50/50",
      });
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Recurring Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Amount (£)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Next Due Date</Label>
            <Input
              type="date"
              value={formData.nextDueDate}
              onChange={(e) =>
                setFormData({ ...formData, nextDueDate: e.target.value })
              }
            />
          </div>
          <CategorySelector
            selectedCategory={formData.category}
            onChange={(cat) => setFormData({ ...formData, category: cat })}
          />
          <LocationSelector
            selectedLocation={formData.location}
            onChange={(loc) => setFormData({ ...formData, location: loc })}
          />
          <FrequencySelector
            selectedFrequency={formData.frequency}
            onChange={(freq) => setFormData({ ...formData, frequency: freq })}
          />
          <UserSelector
            selectedUserId={formData.userId}
            onChange={(id) => setFormData({ ...formData, userId: id })}
          />
          <div>
            <Label>Description</Label>
            <Input
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
              {isSubmitting ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRecurringExpenseForm;

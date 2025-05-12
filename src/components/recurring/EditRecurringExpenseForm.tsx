import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateRecurringExpense } from "@/services/expenseService";
import AmountInput from "@/components/expense/AmountInput";
import DateSelector from "@/components/expense/DateSelector";
import CategorySelector from "@/components/expense/CategorySelector";
import LocationSelector from "@/components/expense/LocationSelector";
import FrequencySelector from "@/components/recurring/FrequencySelector";
import SplitTypeSelector from "@/components/expense/SplitTypeSelector";
import { RecurringExpense } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface EditRecurringExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  recurringExpense: RecurringExpense;
}

const EditRecurringExpenseForm = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  recurringExpense 
}: EditRecurringExpenseFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: String(recurringExpense.amount),
    nextDueDate: new Date(recurringExpense.nextDueDate),
    category: recurringExpense.category,
    location: recurringExpense.location,
    description: recurringExpense.description || "",
    frequency: recurringExpense.frequency,
    split: recurringExpense.split || "50/50",
  });

  // Update form data when recurring expense changes
  useEffect(() => {
    setFormData({
      amount: String(recurringExpense.amount),
      nextDueDate: new Date(recurringExpense.nextDueDate),
      category: recurringExpense.category,
      location: recurringExpense.location,
      description: recurringExpense.description || "",
      frequency: recurringExpense.frequency,
      split: recurringExpense.split || "50/50",
    });
  }, [recurringExpense]);

  const handleChange = (field: string, value: string | number | Date) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate form
      if (!formData.amount || !formData.nextDueDate || !formData.category || !formData.frequency) {
        toast({
          title: "Missing fields",
          description: "Please fill all required fields",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Format the data for submission
      const updateData = {
        id: recurringExpense.id,
        amount: parseFloat(formData.amount),
        next_due_date: format(formData.nextDueDate, "yyyy-MM-dd"),
        category: formData.category,
        location: formData.location,
        description: formData.description,
        frequency: formData.frequency,
        split_type: formData.split,
        // Keep the original user ID
        user_id: recurringExpense.userId,
      };

      // Update the recurring expense
      await updateRecurringExpense(updateData);
      
      // Success message
      toast({
        title: "Recurring expense updated",
        description: "Your recurring expense has been successfully updated.",
      });
      
      // Close dialog and refresh parent
      onSuccess();
      onClose();
      
    } catch (error) {
      console.error("Error updating recurring expense:", error);
      toast({
        title: "Error",
        description: "Failed to update recurring expense. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => !isSubmitting && onClose()}>
      <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Recurring Expense</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="py-4">
          {/* Amount and Date in the same row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <AmountInput 
                value={formData.amount} 
                onChange={(value) => handleChange("amount", value)} 
              />
            </div>
            <div>
              <DateSelector 
                selectedDate={formData.nextDueDate} 
                onChange={(date) => handleChange("nextDueDate", date)} 
              />
            </div>
          </div>

          {/* Category */}
          <CategorySelector 
            selectedCategory={formData.category} 
            onChange={(category) => handleChange("category", category)} 
          />

          {/* Location */}
          <LocationSelector 
            selectedLocation={formData.location} 
            onChange={(location) => handleChange("location", location)} 
          />

          {/* Split Type */}
          <SplitTypeSelector 
            selectedSplitType={formData.split}
            onChange={(splitType) => handleChange("split", splitType)}
          />

          {/* Frequency */}
          <FrequencySelector 
            selectedFrequency={formData.frequency} 
            onChange={(frequency) => handleChange("frequency", frequency)} 
          />

          {/* Description */}
          <div className="mb-6">
            <Label htmlFor="edit-description">Description (Optional)</Label>
            <div className="mt-1">
              <Input
                type="text"
                id="edit-description"
                placeholder="Add notes about this recurring expense"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
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

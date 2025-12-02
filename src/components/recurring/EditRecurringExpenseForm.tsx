import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUpdateRecurringExpense } from "@/hooks/useConvexData";
import { RecurringExpense } from "@/types";
import { Id } from "../../../convex/_generated/dataModel";
import CategorySelector from "@/components/expense/CategorySelector";
import LocationSelector from "@/components/expense/LocationSelector";
import FrequencySelector from "@/components/recurring/FrequencySelector";

interface EditRecurringExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  expense: RecurringExpense;
  onSuccess: () => void;
}

const EditRecurringExpenseForm = ({ isOpen, onClose, expense, onSuccess }: EditRecurringExpenseFormProps) => {
  const { toast } = useToast();
  const updateRecurring = useUpdateRecurringExpense();
  const [formData, setFormData] = useState({ amount: "", nextDueDate: "", category: "", location: "", description: "", frequency: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (expense) {
      setFormData({
        amount: expense.amount.toString(),
        nextDueDate: expense.nextDueDate,
        category: expense.category,
        location: expense.location,
        description: expense.description || "",
        frequency: expense.frequency,
      });
    }
  }, [expense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateRecurring({
        id: expense.id as Id<"recurring">,
        amount: parseFloat(formData.amount),
        nextDueDate: formData.nextDueDate,
        categoryName: formData.category,
        locationName: formData.location,
        description: formData.description || undefined,
        frequency: formData.frequency,
      });
      toast({ title: "Success", description: "Recurring expense updated." });
      onSuccess();
      onClose();
    } catch {
      toast({ title: "Error", description: "Failed to update.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Edit Recurring Expense</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Amount (£)</Label><Input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} /></div>
          <div><Label>Next Due Date</Label><Input type="date" value={formData.nextDueDate} onChange={(e) => setFormData({...formData, nextDueDate: e.target.value})} /></div>
          <CategorySelector selectedCategory={formData.category} onChange={(cat) => setFormData({...formData, category: cat})} />
          <LocationSelector selectedLocation={formData.location} onChange={(loc) => setFormData({...formData, location: loc})} />
          <FrequencySelector selectedFrequency={formData.frequency} onChange={(freq) => setFormData({...formData, frequency: freq})} />
          <div><Label>Description</Label><Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditRecurringExpenseForm;

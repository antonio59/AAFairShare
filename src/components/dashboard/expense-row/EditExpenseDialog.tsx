import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Expense } from "@/types";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import AmountInput from "@/components/expense/AmountInput";
import DateSelector from "@/components/expense/DateSelector";
import CategorySelector from "@/components/expense/CategorySelector";
import LocationSelector from "@/components/expense/LocationSelector";
import SplitTypeSelector from "@/components/expense/SplitTypeSelector";

interface EditExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense;
  setExpense: React.Dispatch<React.SetStateAction<Expense>>;
  onSave: () => Promise<void>;
  isSubmitting: boolean;
}

const EditExpenseDialog = ({ isOpen, onClose, expense, setExpense, onSave, isSubmitting }: EditExpenseDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
          <DialogDescription>Modify the details of your expense.</DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <AmountInput value={String(expense.amount)} onChange={(value) => setExpense({...expense, amount: parseFloat(value) || 0})} />
            <DateSelector selectedDate={new Date(expense.date)} onChange={(date) => setExpense({...expense, date: format(date, "yyyy-MM-dd")})} />
          </div>
          <CategorySelector selectedCategory={expense.category} onChange={(category) => setExpense({...expense, category})} />
          <LocationSelector selectedLocation={expense.location} onChange={(location) => setExpense({...expense, location})} />
          <SplitTypeSelector selectedSplitType={expense.split} onChange={(splitType) => setExpense({...expense, split: splitType})} />
          <div className="mb-6">
            <label className="text-sm font-medium">Description (Optional)</label>
            <Input className="mt-2" placeholder="Add notes" value={expense.description || ''} onChange={(e) => setExpense({...expense, description: e.target.value})} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={onSave} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditExpenseDialog;

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Expense } from "@/types";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { updateExpense } from "@/services/expenseService";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

// Import the same components used in AddExpense
import AmountInput from "@/components/expense/AmountInput";
import DateSelector from "@/components/expense/DateSelector";
import CategorySelector from "@/components/expense/CategorySelector";
import LocationSelector from "@/components/expense/LocationSelector";
import SplitTypeSelector from "@/components/expense/SplitTypeSelector";
import { User } from "@/types";

interface EditExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense;
  editedExpense: Expense;
  setEditedExpense: React.Dispatch<React.SetStateAction<Expense>>;
  user: User;
  isSubmitting: boolean;
  handleSave: () => Promise<void>;
}

const EditExpenseDialog = ({
  isOpen,
  onClose,
  expense,
  editedExpense,
  setEditedExpense,
  user,
  isSubmitting,
  handleSave
}: EditExpenseDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
          <DialogDescription>
            Modify the details of your expense.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 overflow-y-auto max-h-[80vh]">
          {/* Amount and Date in the same row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <AmountInput 
                value={String(editedExpense.amount)} 
                onChange={(value) => setEditedExpense({...editedExpense, amount: parseFloat(value) || 0})} 
              />
            </div>
            <div>
              <DateSelector 
                selectedDate={new Date(editedExpense.date)} 
                onChange={(date) => {
                  const formattedDate = format(date, "yyyy-MM-dd");
                  setEditedExpense({...editedExpense, date: formattedDate})
                }} 
              />
            </div>
          </div>

          {/* Category */}
          <CategorySelector 
            selectedCategory={editedExpense.category} 
            onChange={(category) => setEditedExpense({...editedExpense, category})} 
          />

          {/* Location */}
          <LocationSelector 
            selectedLocation={editedExpense.location} 
            onChange={(location) => setEditedExpense({...editedExpense, location})} 
          />

          {/* Split Type */}
          <SplitTypeSelector 
            selectedSplitType={editedExpense.split} 
            onChange={(splitType) => setEditedExpense({...editedExpense, split: splitType})} 
          />

          {/* Description */}
          <div className="mb-6">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Description (Optional)
            </label>
            <div className="mt-2">
              <Input
                type="text"
                placeholder="Add notes about this expense"
                value={editedExpense.description || ''}
                onChange={(e) => setEditedExpense({...editedExpense, description: e.target.value})}
              />
            </div>
          </div>

          {/* Paid By Information (Not Editable) */}
          <div className="mb-6">
            <label className="text-sm font-medium leading-none">Paid By</label>
            <div className="mt-2 flex items-center p-2 border rounded-md bg-gray-50">
              <div className="h-8 w-8 mr-2 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="h-full w-full object-cover" />
                ) : (
                  <span>{user.username?.charAt(0).toUpperCase() || '?'}</span>
                )}
              </div>
              <span>{user.username}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditExpenseDialog;

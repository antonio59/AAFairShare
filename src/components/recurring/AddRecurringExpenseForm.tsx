import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getUsers, addRecurringExpense } from "@/services/expenseService";
import { User } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import RecurringExpenseFormFields from "./RecurringExpenseFormFields";
import { useAppAuth } from "@/hooks/auth";

interface AddRecurringExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddRecurringExpenseForm = ({ isOpen, onClose, onSuccess }: AddRecurringExpenseFormProps) => {
  const { toast } = useToast();
  const { user: currentUser } = useAppAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    nextDueDate: new Date(),
    category: "",
    location: "",
    description: "",
    frequency: "monthly",
    split: "50/50",
    userId: currentUser?.id || "",
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userData = await getUsers();
        setUsers(userData);
        
        // Set default userId if currentUser exists and userId isn't already set
        if (currentUser && !formData.userId) {
          setFormData(prev => ({
            ...prev,
            userId: currentUser.id
          }));
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
        // Optional: Add toast notification for user fetch error
      }
    };
    
    fetchUsers();
  }, [currentUser]);

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
      if (!formData.amount || !formData.nextDueDate || !formData.category || !formData.userId || !formData.frequency) {
        toast({
          title: "Missing fields",
          description: "Please fill all required fields",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Format the data for submission
      const recurringData = {
        amount: parseFloat(formData.amount),
        next_due_date: formData.nextDueDate.toISOString().split('T')[0],
        category: formData.category,
        location: formData.location,
        description: formData.description,
        user_id: formData.userId,
        frequency: formData.frequency,
        split_type: formData.split,
      };

      // Submit the recurring expense
      await addRecurringExpense(recurringData);
      
      // Success message
      toast({
        title: "Recurring expense added",
        description: "Your recurring expense has been successfully added.",
      });
      
      // Close dialog and refresh parent
      onSuccess();
      onClose();
      
    } catch (error) {
      console.error("Error adding recurring expense:", error);
      toast({
        title: "Error",
        description: "Failed to add recurring expense. Please try again.",
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
          <DialogTitle>Add Recurring Expense</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="py-4">
          <RecurringExpenseFormFields 
            formData={formData}
            onChange={handleChange}
          />

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
              {isSubmitting ? "Saving..." : "Save Recurring Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRecurringExpenseForm;

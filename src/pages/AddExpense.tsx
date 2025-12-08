import { useState, useActionState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUsers, useAddExpenseWithLookup } from "@/hooks/useConvexData";
import { useAuth } from "@/providers/AuthContext";
import AmountInput from "@/components/expense/AmountInput";
import DateSelector from "@/components/expense/DateSelector";
import CategorySelector from "@/components/expense/CategorySelector";
import LocationSelector from "@/components/expense/LocationSelector";
import SplitTypeSelector from "@/components/expense/SplitTypeSelector";
import ReceiptUpload from "@/components/expense/ReceiptUpload";
import { Id } from "../../convex/_generated/dataModel";

type FormState = {
  error?: string;
  success?: boolean;
};

const AddExpense = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const users = useUsers();
  const addExpense = useAddExpenseWithLookup();
  
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date(),
    category: "",
    location: "",
    description: "",
    paidBy: currentUser?._id || "",
    split: "50/50",
    receiptId: null as Id<"_storage"> | null,
  });

  const handleChange = (field: string, value: string | number | Date) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const [state, submitAction, isPending] = useActionState<FormState, FormData>(
    async (_prevState, _formData) => {
      if (!formData.amount || !formData.date || !formData.category || !formData.paidBy) {
        toast({
          title: "Missing fields",
          description: "Please fill all required fields",
          variant: "destructive",
        });
        return { error: "Missing required fields" };
      }

      try {
        await addExpense({
          amount: parseFloat(formData.amount),
          date: format(formData.date, "yyyy-MM-dd"),
          categoryName: formData.category,
          locationName: formData.location || "Other",
          description: formData.description || undefined,
          paidById: formData.paidBy as Id<"users">,
          splitType: formData.split,
          receiptId: formData.receiptId || undefined,
        });

        toast({
          title: "Expense added",
          description: "Your expense has been successfully added.",
        });

        navigate("/");
        return { success: true };
      } catch (error) {
        console.error("Error adding expense:", error);
        toast({
          title: "Error",
          description: "Failed to add expense. Please try again.",
          variant: "destructive",
        });
        return { error: "Failed to add expense" };
      }
    },
    { error: undefined, success: false }
  );

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-center">Add Expense</h1>
      </div>

      <form action={submitAction}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <AmountInput
              value={formData.amount}
              onChange={(value) => handleChange("amount", value)}
            />
          </div>
          <div>
            <DateSelector
              selectedDate={formData.date}
              onChange={(date) => handleChange("date", date)}
            />
          </div>
        </div>

        <CategorySelector
          selectedCategory={formData.category}
          onChange={(category) => handleChange("category", category)}
        />

        <LocationSelector
          selectedLocation={formData.location}
          onChange={(location) => handleChange("location", location)}
        />

        <SplitTypeSelector
          selectedSplitType={formData.split}
          onChange={(splitType) => handleChange("split", splitType)}
        />

        <div className="mb-6">
          <Label htmlFor="description">Description (Optional)</Label>
          <div className="mt-1">
            <Input
              type="text"
              id="description"
              placeholder="Add notes about this expense"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>
        </div>

        <ReceiptUpload
          receiptId={formData.receiptId}
          onUpload={(storageId) => setFormData(prev => ({ ...prev, receiptId: storageId }))}
          onRemove={() => setFormData(prev => ({ ...prev, receiptId: null }))}
        />

        <div className="grid grid-cols-2 gap-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button type="submit" size="lg" disabled={isPending}>
            {isPending ? "Saving..." : "Save Expense"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddExpense;

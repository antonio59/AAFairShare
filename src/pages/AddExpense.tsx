import { useState } from "react";
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
import { Id } from "../../convex/_generated/dataModel";

const AddExpense = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const users = useUsers();
  const addExpense = useAddExpenseWithLookup();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date(),
    category: "",
    location: "",
    description: "",
    paidBy: currentUser?._id || "",
    split: "50/50",
  });

  const handleChange = (field: string, value: string | number | Date) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.amount || !formData.date || !formData.category || !formData.paidBy) {
        toast({
          title: "Missing fields",
          description: "Please fill all required fields",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      await addExpense({
        amount: parseFloat(formData.amount),
        date: format(formData.date, "yyyy-MM-dd"),
        categoryName: formData.category,
        locationName: formData.location || "Other",
        description: formData.description || undefined,
        paidById: formData.paidBy as Id<"users">,
        splitType: formData.split,
      });

      toast({
        title: "Expense added",
        description: "Your expense has been successfully added.",
      });

      navigate("/");
    } catch (error) {
      console.error("Error adding expense:", error);
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-center">Add Expense</h1>
      </div>

      <form onSubmit={handleSubmit}>
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

        <div className="mb-10">
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

        <div className="grid grid-cols-2 gap-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button type="submit" size="lg" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Expense"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddExpense;

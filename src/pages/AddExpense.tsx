import { useState, useActionState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAddExpenseWithLookup } from "@/hooks/useConvexData";
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
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const [formState, submitAction, isPending] = useActionState<
    FormState,
    FormData
  >(
    async (_prevState, _formData) => {
      if (
        !formData.amount ||
        !formData.date ||
        !formData.category ||
        !formData.paidBy
      ) {
        return { error: "Please fill all required fields" };
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
        return { error: "Failed to add expense. Please try again." };
      }
    },
    { error: undefined, success: false },
  );

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-semibold text-center mb-6">Add Expense</h1>

        <Card>
          <CardContent className="pt-6 pb-6">
            {formState.error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formState.error}</AlertDescription>
              </Alert>
            )}
            <form action={submitAction} className="space-y-6">
              {/* Group 1: Amount + Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AmountInput
                  value={formData.amount}
                  onChange={(value) => handleChange("amount", value)}
                />
                <DateSelector
                  selectedDate={formData.date}
                  onChange={(date) => handleChange("date", date)}
                />
              </div>

              {/* Group 2: Category + Receipt */}
              <div className="space-y-4">
                <CategorySelector
                  selectedCategory={formData.category}
                  onChange={(category) => handleChange("category", category)}
                />
                <ReceiptUpload
                  receiptId={formData.receiptId}
                  onUpload={(storageId) =>
                    setFormData((prev) => ({ ...prev, receiptId: storageId }))
                  }
                  onRemove={() =>
                    setFormData((prev) => ({ ...prev, receiptId: null }))
                  }
                />
              </div>

              {/* Group 3: Location + Split + Description */}
              <div className="space-y-4">
                <LocationSelector
                  selectedLocation={formData.location}
                  onChange={(location) => handleChange("location", location)}
                />
                <SplitTypeSelector
                  selectedSplitType={formData.split}
                  onChange={(splitType) => handleChange("split", splitType)}
                />
                <div>
                  <Label
                    htmlFor="description"
                    className="text-sm font-medium mb-1.5 block"
                  >
                    Description{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    type="text"
                    id="description"
                    placeholder="Add notes about this expense"
                    className="w-full"
                    value={formData.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : "Save Expense"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddExpense;

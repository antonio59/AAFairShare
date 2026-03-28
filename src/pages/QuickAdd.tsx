import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Zap, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAddExpenseWithLookup, useUsers } from "@/hooks/useConvexData";
import { useAuth } from "@/providers/AuthContext";
import AmountInput from "@/components/expense/AmountInput";
import DateSelector from "@/components/expense/DateSelector";
import CategorySelector from "@/components/expense/CategorySelector";
import LocationSelector from "@/components/expense/LocationSelector";
import SplitTypeSelector from "@/components/expense/SplitTypeSelector";
import { Id } from "../../convex/_generated/dataModel";

const QuickAdd = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const users = useUsers();
  const addExpense = useAddExpenseWithLookup();

  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Parse URL parameters for pre-filling
  const sourceParam = searchParams.get("source"); // applepay, googlepay, ifttt, etc.
  const amountParam = searchParams.get("amount");
  const merchantParam = searchParams.get("merchant") || searchParams.get("description");
  const dateParam = searchParams.get("date");
  const categoryParam = searchParams.get("category");

  const [formData, setFormData] = useState({
    amount: amountParam || "",
    date: dateParam ? new Date(dateParam) : new Date(),
    category: categoryParam || "",
    location: merchantParam || "",
    description: merchantParam || "",
    paidBy: "",
    split: "50/50",
  });

  // Set paidBy when user loads
  useEffect(() => {
    if (currentUser?._id && !formData.paidBy) {
      setFormData(prev => ({ ...prev, paidBy: currentUser._id as string }));
    }
  }, [currentUser?._id, formData.paidBy]);

  const handleChange = (field: string, value: string | number | Date) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.amount || !formData.date || !formData.category || !formData.paidBy) {
      setError("Please fill all required fields");
      return;
    }

    setIsPending(true);

    try {
      await addExpense({
        amount: parseFloat(formData.amount),
        date: format(formData.date, "yyyy-MM-dd"),
        categoryName: formData.category,
        locationName: formData.location || "Other",
        description: formData.description || undefined,
        paidById: formData.paidBy as Id<"users">,
        splitType: formData.split,
      });

      setSuccess(true);
      toast({
        title: "Expense logged!",
        description: `£${formData.amount} added successfully.`,
      });

      // Auto-close after success if from automation
      if (sourceParam) {
        setTimeout(() => {
          window.close();
        }, 1500);
      }
    } catch (err) {
      console.error("Error adding expense:", err);
      setError("Failed to add expense. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  const handleSkip = () => {
    if (sourceParam) {
      window.close();
    } else {
      navigate("/");
    }
  };

  // Redirect to login if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">
              Please log in to add expenses.
            </p>
            <Button onClick={() => navigate("/login")}>Log In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Expense Logged!</h2>
            <p className="text-muted-foreground mb-4">
              £{formData.amount} - {formData.category}
            </p>
            {!sourceParam && (
              <Button variant="outline" onClick={() => navigate("/")}>
                Go to Dashboard
              </Button>
            )}
            {sourceParam && (
              <p className="text-sm text-muted-foreground">
                This window will close automatically...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-xl">Quick Add Expense</CardTitle>
          </div>
          {sourceParam && (
            <CardDescription>
              From {sourceParam === "applepay" ? "Apple Pay" : sourceParam === "googlepay" ? "Google Pay" : sourceParam}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <AmountInput
                value={formData.amount}
                onChange={(value) => handleChange("amount", value)}
              />
              <DateSelector
                selectedDate={formData.date}
                onChange={(date) => handleChange("date", date)}
              />
            </div>

            <CategorySelector
              selectedCategory={formData.category}
              onChange={(category) => handleChange("category", category)}
            />

            <LocationSelector
              selectedLocation={formData.location}
              onChange={(location) => handleChange("location", location)}
            />

            <div>
              <Label htmlFor="paidBy" className="text-sm font-medium mb-1.5 block">
                Paid By
              </Label>
              <select
                id="paidBy"
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={formData.paidBy}
                onChange={(e) => handleChange("paidBy", e.target.value)}
              >
                <option value="">Select...</option>
                {users?.map((u) => (
                  <option key={u._id || u.id} value={u._id || u.id}>
                    {u.name || u.username || u.email}
                  </option>
                ))}
              </select>
            </div>

            <SplitTypeSelector
              selectedSplitType={formData.split}
              onChange={(splitType) => handleChange("split", splitType)}
            />

            <div>
              <Label htmlFor="description" className="text-sm font-medium mb-1.5 block">
                Description <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                type="text"
                id="description"
                placeholder="Add notes"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleSkip}
              >
                <X className="h-4 w-4 mr-2" />
                Skip
              </Button>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending ? "Saving..." : "Log Expense"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickAdd;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addExpense, getUsers } from "@/services/expenseService";
import AmountInput from "@/components/expense/AmountInput";
import DateSelector from "@/components/expense/DateSelector";
import CategorySelector from "@/components/expense/CategorySelector";
import LocationSelector from "@/components/expense/LocationSelector";
import SplitTypeSelector from "@/components/expense/SplitTypeSelector";
import { User } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { useAppAuth } from "@/hooks/auth";
import { getCurrentMonth, getCurrentYear } from "@/services/expenseService";

const AddExpense = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient(); 
  const { user: currentUser } = useAppAuth(); 
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date(),
    category: "",
    location: "",
    description: "",
    paidBy: currentUser?.id || "", 
    split: "50/50", 
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userData = await getUsers();
        setUsers(userData);
        
        if (currentUser && !formData.paidBy) {
          setFormData(prev => ({
            ...prev,
            paidBy: currentUser.id
          }));
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast({
          title: "Error",
          description: "Failed to load user data.",
          variant: "destructive",
        });
      }
    };
    
    fetchUsers();
  }, [toast, currentUser, formData.paidBy]); 

  const handleChange = (field: string, value: string | number | Date) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("[handleSubmit] Form submitted.");

    try {
      if (!formData.amount || !formData.date || !formData.category || !formData.paidBy) {
        console.log("[handleSubmit] Validation failed: Missing fields.");
        toast({
          title: "Missing fields",
          description: "Please fill all required fields",
          variant: "destructive",
        });
        return;
      }

      const expenseData = {
        amount: parseFloat(formData.amount),
        date: format(formData.date, "yyyy-MM-dd"),
        category: formData.category,
        location: formData.location,
        description: formData.description,
        paidBy: formData.paidBy, 
        split: formData.split,
      };

      console.log("[handleSubmit] Submitting expense data:", expenseData); 
      console.log("[handleSubmit] BEFORE await addExpense(expenseData);");

      await addExpense(expenseData);
      
      console.log("[handleSubmit] AFTER await addExpense(expenseData); - SUCCESS!");

      toast({
        title: "Expense added",
        description: "Your expense has been successfully added.",
      });
      
      const expenseDate = new Date(expenseData.date);
      const expenseYear = expenseDate.getFullYear();
      const expenseMonth = expenseDate.getMonth() + 1; 
      
      await queryClient.invalidateQueries({ 
        queryKey: ["monthData", expenseYear, expenseMonth]
      });
      
      const currentYear = getCurrentYear();
      const currentMonth = getCurrentMonth();
      if (expenseYear !== currentYear || expenseMonth !== currentMonth) {
        await queryClient.invalidateQueries({ 
          queryKey: ["monthData", currentYear, currentMonth]
        });
      }
      
      navigate("/");
      
    } catch (error) {
      console.error("[handleSubmit] CAUGHT ERROR in handleSubmit:", error);
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      });
    }
    console.log("[handleSubmit] Exiting function.");
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
          <Button type="submit" size="lg">
            Save Expense
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddExpense;

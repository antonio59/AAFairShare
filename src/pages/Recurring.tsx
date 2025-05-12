import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getRecurringExpenses, getUsers } from "@/services/expenseService";
import AddRecurringExpenseForm from "@/components/recurring/AddRecurringExpenseForm";
import RecurringExpenseRow from "@/components/recurring/RecurringExpenseRow";
import { RecurringExpense, User } from "@/types";

const Recurring = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Format the current month for display
  const currentMonthLabel = format(new Date(year, month - 1, 1), "MMMM yyyy");

  const navigateMonth = (direction: "prev" | "next") => {
    let newMonth = month;
    let newYear = year;

    if (direction === "prev") {
      newMonth -= 1;
      if (newMonth === 0) {
        newMonth = 12;
        newYear -= 1;
      }
    } else {
      newMonth += 1;
      if (newMonth === 13) {
        newMonth = 1;
        newYear += 1;
      }
    }

    setMonth(newMonth);
    setYear(newYear);
  };

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [expensesData, usersData] = await Promise.all([
        getRecurringExpenses(),
        getUsers()
      ]);
      setRecurringExpenses(expensesData);
      setUsers(usersData);
    } catch (error) {
      console.error("Failed to fetch recurring expenses:", error);
      toast({
        title: "Error",
        description: "Failed to load recurring expenses.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, setIsLoading, setRecurringExpenses, setUsers]);

  // Load data on initial render
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Function to find user by ID
  const getUserById = (userId: string): User => {
    return users.find(u => u.id === userId) || { 
      id: userId, 
      name: "Unknown User",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=unknown`
    };
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Recurring Expenses</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-28 text-center">
              {currentMonthLabel}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Recurring
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      ) : recurringExpenses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-medium mb-2">No recurring expenses yet</h3>
          <p className="text-gray-500 mb-6">
            Set up recurring expenses for items that repeat regularly, like rent or subscriptions.
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Recurring Expense
          </Button>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Due Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category/Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Frequency
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recurringExpenses.map((expense) => (
                  <RecurringExpenseRow 
                    key={expense.id} 
                    expense={expense} 
                    user={getUserById(expense.userId)} 
                    onRefresh={loadData}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddRecurringExpenseForm 
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};

export default Recurring;

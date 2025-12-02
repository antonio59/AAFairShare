import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Filter } from "lucide-react";
import { useRecurringExpenses, useUsers } from "@/hooks/useConvexData";
import AddRecurringExpenseForm from "@/components/recurring/AddRecurringExpenseForm";
import RecurringExpenseRow from "@/components/recurring/RecurringExpenseRow";
import { User } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Recurring = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "ended">("active");

  const recurringExpenses = useRecurringExpenses();
  const users = useUsers();

  const isLoading = recurringExpenses === undefined || users === undefined;
  const currentMonthLabel = format(new Date(year, month - 1, 1), "MMMM yyyy");

  const navigateMonth = (direction: "prev" | "next") => {
    let newMonth = month;
    let newYear = year;
    if (direction === "prev") {
      newMonth -= 1;
      if (newMonth === 0) { newMonth = 12; newYear -= 1; }
    } else {
      newMonth += 1;
      if (newMonth === 13) { newMonth = 1; newYear += 1; }
    }
    setMonth(newMonth);
    setYear(newYear);
  };

  const getUserById = (userId: string): User => {
    const user = users?.find(u => u._id === userId);
    return user ? { id: user._id, username: user.username, email: user.email, avatar: user.photoUrl } : { id: userId, username: "Unknown", email: "" };
  };

  const expenses = recurringExpenses ?? [];
  const filteredExpenses = expenses.filter(e => statusFilter === "all" || e.status === statusFilter);
  const activeCount = expenses.filter(e => e.status === 'active').length;
  const endedCount = expenses.filter(e => e.status === 'ended').length;

  return (
    <div className="p-4 sm:p-6 pb-20 sm:pb-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold">Recurring Expenses</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" /><span className="capitalize">{statusFilter}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | "active" | "ended")}>
                <DropdownMenuRadioItem value="all">All ({expenses.length})</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="active">Active ({activeCount})</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="ended">Ended ({endedCount})</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateMonth("prev")}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium w-28 text-center">{currentMonthLabel}</span>
          <Button variant="outline" size="icon" onClick={() => navigateMonth("next")}><ChevronRight className="h-4 w-4" /></Button>
          <Button onClick={() => setIsAddDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Add</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>
      ) : filteredExpenses.length === 0 ? (
        <div className="bg-card rounded-lg shadow-sm p-12 text-center">
          <p className="text-muted-foreground mb-4">{expenses.length === 0 ? "No recurring expenses yet" : `No ${statusFilter} expenses`}</p>
          {expenses.length === 0 && <Button onClick={() => setIsAddDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Add First</Button>}
        </div>
      ) : (
        <div className="bg-card shadow-sm rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Next Due</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Frequency</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredExpenses.map((expense) => (
                <RecurringExpenseRow
                  key={expense._id}
                  expense={{ id: expense._id, amount: expense.amount, nextDueDate: expense.nextDueDate, endDate: expense.endDate, frequency: expense.frequency, description: expense.description ?? "", userId: expense.userId, category: expense.category, location: expense.location, split: expense.splitType as "50/50" | "custom" | "100%", status: expense.status as "active" | "ended" }}
                  user={getUserById(expense.userId)}
                  onRefresh={() => {}}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AddRecurringExpenseForm isOpen={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} onSuccess={() => setIsAddDialogOpen(false)} />
    </div>
  );
};

export default Recurring;

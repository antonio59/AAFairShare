import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";
import { Expense, User } from "@/types";
import ExpenseTableHeader from "./ExpenseTableHeader";
import ExpenseTableRow from "./ExpenseTableRow";
import ExpenseTableFooter from "./ExpenseTableFooter";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { useAppAuth } from "@/hooks/auth";
import MobileExpenseCard from "./MobileExpenseCard";

interface ExpensesTableProps {
  expenses: Expense[] | undefined;
  searchTerm: string;
  isMobile?: boolean;
}

const ExpensesTable = ({ expenses, searchTerm, isMobile }: ExpensesTableProps) => {
  const { users = [] } = useAppAuth();

  // Filter expenses based on search term
  const filteredExpenses = expenses?.filter((expense) => {
    const searchTermLower = searchTerm.toLowerCase();
    // Find user name for filtering
    const paidByUserForFilter = users.find(u => u.id === expense.paidBy);
    const paidByUsername = paidByUserForFilter?.username.toLowerCase() || "";

    return (
      expense.category.toLowerCase().includes(searchTermLower) ||
      expense.location.toLowerCase().includes(searchTermLower) ||
      expense.description?.toLowerCase().includes(searchTermLower) ||
      paidByUsername.includes(searchTermLower)
    );
  });

  if (isMobile && filteredExpenses && filteredExpenses.length > 0) {
    // Mobile card view for expenses
    return (
      <div className="p-2">
        {filteredExpenses.map((expense) => {
          const paidByUser = users.find(u => u.id === expense.paidBy);
          // Provide a fallback User object if paidByUser is not found
          const validPaidByUser: User = paidByUser || {
            id: 'unknown',
            username: "Unknown User",
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=unknown`
          };

          return (
            <MobileExpenseCard 
              key={expense.id} 
              expense={expense} 
              paidByUser={validPaidByUser} 
            />
          );
        })}
        <ExpenseTableFooter count={filteredExpenses.length || 0} />
      </div>
    );
  }

  // Desktop table view remains largely the same, ensure ExpenseTableRow also uses usernames if it doesn't already.
  return (
    <>
      <div className={isMobile ? "overflow-x-auto -mx-4" : ""}>
        <table className={`min-w-full ${isMobile ? "table-fixed" : ""}`}>
          <ExpenseTableHeader isMobile={isMobile} />
          <tbody>
            {filteredExpenses && filteredExpenses.length > 0 ? (
              filteredExpenses.map((expense) => (
                <ExpenseTableRow key={expense.id} expense={expense} />
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  {searchTerm ? "No matching expenses found." : "No expenses found for this month."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ExpenseTableFooter count={filteredExpenses?.length || 0} />
    </>
  );
};

export default ExpensesTable;

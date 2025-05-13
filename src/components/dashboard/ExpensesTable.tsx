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
          const paidByName = paidByUser?.username || "Unknown User";

          return (
            <div key={expense.id} className="bg-white p-3 rounded-lg border mb-3 shadow-sm">
              <div className="flex justify-between items-start mb-1.5">
                <div>
                  <div className="font-medium text-sm">{expense.category}</div>
                  <div className="text-xs text-gray-500">{expense.location}</div>
                </div>
                <div className="font-bold text-sm">£{expense.amount.toFixed(2)}</div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <div>{format(new Date(expense.date), "MMM d, yyyy")}</div>
                <div>Paid by: {paidByName}</div>
              </div>
              {expense.description && (
                <div className="text-xs mb-2 text-gray-600">{expense.description}</div>
              )}
              <div className="flex justify-end gap-2 mt-2">
                <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-auto">
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" className="text-red-500 text-xs px-2 py-1 h-auto">
                  <Trash className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
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

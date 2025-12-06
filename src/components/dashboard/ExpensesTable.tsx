import { Expense } from "@/types";
import ExpenseTableHeader from "./ExpenseTableHeader";
import ExpenseTableRow from "./ExpenseTableRow";
import ExpenseTableFooter from "./ExpenseTableFooter";
import MobileExpenseCard from "./MobileExpenseCard";
import { useAuth } from "@/providers/AuthContext";

interface ExpensesTableProps {
  expenses: Expense[] | undefined;
  searchTerm: string;
  isMobile?: boolean;
}

const ExpensesTable = ({ expenses, searchTerm, isMobile }: ExpensesTableProps) => {
  const { users = [] } = useAuth();

  const filteredExpenses = expenses?.filter((expense) => {
    const searchTermLower = searchTerm.toLowerCase();
    const paidByUser = users.find(u => u.id === expense.paidBy || u._id === expense.paidBy);
    const paidByUsername = paidByUser?.username?.toLowerCase() || "";

    return (
      expense.category.toLowerCase().includes(searchTermLower) ||
      expense.location.toLowerCase().includes(searchTermLower) ||
      expense.description?.toLowerCase().includes(searchTermLower) ||
      paidByUsername.includes(searchTermLower)
    );
  });

  if (isMobile) {
    return (
      <div className="p-3">
        {filteredExpenses && filteredExpenses.length > 0 ? (
          <>
            {filteredExpenses.map((expense) => (
              <MobileExpenseCard key={expense.id} expense={expense} />
            ))}
            <ExpenseTableFooter count={filteredExpenses.length} />
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "No matching expenses found." : "No expenses found for this month."}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <ExpenseTableHeader />
          <tbody className="divide-y divide-border">
            {filteredExpenses && filteredExpenses.length > 0 ? (
              filteredExpenses.map((expense) => (
                <ExpenseTableRow key={expense.id} expense={expense} />
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
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

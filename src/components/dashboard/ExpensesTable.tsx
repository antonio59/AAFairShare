import { Expense, User } from "@/types";
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

  if (isMobile && filteredExpenses && filteredExpenses.length > 0) {
    return (
      <div className="p-2">
        {filteredExpenses.map((expense) => {
          const paidByUser = users.find(u => u.id === expense.paidBy || u._id === expense.paidBy);
          const validPaidByUser: User = paidByUser || { id: 'unknown', username: "Unknown", avatar: "" };
          return <MobileExpenseCard key={expense.id} expense={expense} paidByUser={validPaidByUser} />;
        })}
        <ExpenseTableFooter count={filteredExpenses.length || 0} />
      </div>
    );
  }

  return (
    <>
      <div className={isMobile ? "overflow-x-auto -mx-4" : ""}>
        <table className={`min-w-full ${isMobile ? "table-fixed" : ""}`}>
          <ExpenseTableHeader isMobile={isMobile} />
          <tbody>
            {filteredExpenses && filteredExpenses.length > 0 ? (
              filteredExpenses.map((expense) => <ExpenseTableRow key={expense.id} expense={expense} />)
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

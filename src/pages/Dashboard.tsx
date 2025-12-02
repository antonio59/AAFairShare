import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useMonthData } from "@/hooks/useConvexData";
import { 
  getCurrentMonth, 
  getCurrentYear,
  formatMonthString
} from "@/services/utils/dateUtils";
import { downloadCSV, downloadPDF } from "@/services/export";
import { useIsMobile } from "@/hooks/use-mobile";

import MonthNavigator from "@/components/dashboard/MonthNavigator";
import ExportMenu from "@/components/dashboard/ExportMenu";
import SummaryCards from "@/components/dashboard/SummaryCards";
import ExpenseFilter from "@/components/dashboard/ExpenseFilter";
import ExpensesTable from "@/components/dashboard/ExpensesTable";
import QuickStats from "@/components/dashboard/QuickStats";

const Dashboard = () => {
  const navigate = useNavigate();
  const [year, setYear] = useState(getCurrentYear());
  const [month, setMonth] = useState(getCurrentMonth());
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();

  const monthString = formatMonthString(year, month);
  const monthData = useMonthData(monthString);
  const isLoading = monthData === undefined;

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

  const handleExportCSV = () => {
    if (monthData?.expenses) {
      const mappedExpenses = monthData.expenses.map(exp => ({
        id: exp.id,
        amount: exp.amount,
        date: exp.date,
        category: exp.category,
        location: exp.location,
        description: exp.description,
        paidBy: exp.paidBy,
        split: exp.split as "50/50" | "custom" | "100%"
      }));
      downloadCSV(mappedExpenses, year, month);
    }
  };

  const handleExportPDF = () => {
    if (monthData?.expenses) {
      const mappedExpenses = monthData.expenses.map(exp => ({
        id: exp.id,
        amount: exp.amount,
        date: exp.date,
        category: exp.category,
        location: exp.location,
        description: exp.description,
        paidBy: exp.paidBy,
        split: exp.split as "50/50" | "custom" | "100%"
      }));
      downloadPDF(mappedExpenses, year, month);
    }
  };

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      <div className={`flex ${isMobile ? "flex-col gap-3" : "justify-between items-center"} mb-6`}>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <MonthNavigator 
            year={year}
            month={month}
            onNavigate={navigateMonth}
            isMobile={isMobile}
          />
          <ExportMenu
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
          />
          {!isMobile && (
            <Button
              onClick={() => navigate("/add-expense")}
              aria-label="Add Expense"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>Add Expense</span>
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div>Loading...</div>
        </div>
      ) : !monthData ? (
        <div className="flex justify-center p-12 text-red-500">
          Error loading data.
        </div>
      ) : (
        <>
          {!isMobile && <QuickStats currentMonth={monthString} />}
          
          <SummaryCards
            totalExpenses={monthData.totalExpenses}
            user1Paid={monthData.user1Paid}
            user2Paid={monthData.user2Paid}
            settlement={monthData.settlement}
            isMobile={isMobile}
          />

          <div className="bg-card rounded-lg shadow">
            <div className={`p-4 md:p-6 border-b ${isMobile ? "flex flex-col gap-4" : "flex justify-between items-center"}`}>
              <h2 className="text-lg font-semibold">Expenses</h2>
              <ExpenseFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                isMobile={isMobile}
              />
            </div>
          
            <div className="overflow-x-auto">
              <ExpensesTable 
                expenses={monthData.expenses.map(exp => ({
                  id: exp.id,
                  amount: exp.amount,
                  date: exp.date,
                  category: exp.category,
                  location: exp.location,
                  description: exp.description,
                  paidBy: exp.paidBy,
                  split: exp.split as "50/50" | "custom" | "100%"
                }))}
                searchTerm={searchTerm}
                isMobile={isMobile}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;

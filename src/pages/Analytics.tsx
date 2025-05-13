import { useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAnalyticsData, getCurrentYear, getCurrentMonth, getUsers } from "@/services/expenseService";
import MonthlySummaryCard from "@/components/analytics/MonthlySummaryCard";
import AnalyticsCharts from "@/components/analytics/AnalyticsCharts";
import MonthNavigator from "@/components/dashboard/MonthNavigator";
import { useIsMobile } from "@/hooks/use-mobile";

// Color palette for charts
const COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#f97316", // orange
  "#10b981", // green
  "#8b5cf6", // purple
  "#06b6d4", // cyan
];

const Analytics = () => {
  const [year, setYear] = useState(getCurrentYear());
  const [month, setMonth] = useState(getCurrentMonth());
  const isMobile = useIsMobile();

  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics", year, month],
    queryFn: () => getAnalyticsData(year, month),
  });

  // Fetch users to display their names
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

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

  // Format the month for display
  const currentMonthLabel = format(new Date(year, month - 1, 1), "MMMM yyyy");

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 sm:mb-6 gap-4 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold">Analytics Dashboard</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <MonthNavigator 
            year={year}
            month={month}
            onNavigate={navigateMonth}
            isMobile={isMobile}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div>Loading...</div>
        </div>
      ) : error ? (
        <div className="flex justify-center p-12 text-red-500">
          Error loading data.
        </div>
      ) : data ? (
        <>
          {/* Monthly Summary */}
          <MonthlySummaryCard
            totalExpenses={data.totalExpenses}
            fairShare={data.fairShare}
            settlement={data.settlement}
            settlementDirection={data.settlementDirection}
          />

          {/* Charts */}
          <AnalyticsCharts
            userComparison={data.userComparison}
            categoryBreakdown={data.categoryBreakdown}
            locationBreakdown={data.locationBreakdown}
            colors={COLORS}
            users={users}
          />
        </>
      ) : (
        <div className="flex justify-center p-12">
          <div>No data available for this month.</div>
        </div>
      )}
    </div>
  );
};

export default Analytics;

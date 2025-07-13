import { useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { AnalyticsData } from "@/types";
import { getAnalyticsData } from "@/services/api/analyticsService";
import { getUsers } from "@/services/api/userService";
import MonthlySummaryCard from "@/components/analytics/MonthlySummaryCard";
import AnalyticsCharts from "@/components/analytics/AnalyticsCharts";
import MonthNavigator from "@/components/dashboard/MonthNavigator";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TrendsChart from "@/components/analytics/TrendsChart";

// Color palette for charts
const COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#f97316", // orange
  "#10b981", // green
  "#8b5cf6", // purple
  "#06b6d4", // cyan
];

type Timeframe = "monthly" | "quarterly" | "yearly";

const Analytics = () => {
  const getCurrentYear = () => new Date().getFullYear();
  const getCurrentMonth = () => new Date().getMonth() + 1;
  const [year, setYear] = useState(getCurrentYear());
  const [month, setMonth] = useState(getCurrentMonth());
  const [timeframe, setTimeframe] = useState<Timeframe>("monthly");
  const isMobile = useIsMobile();
  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ["analytics", year, month, timeframe],
    queryFn: () => getAnalyticsData(year, month, timeframe),
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

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 sm:mb-6 gap-4 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold">Analytics Dashboard</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {timeframe === "monthly" && (
            <MonthNavigator
              year={year}
              month={month}
              onNavigate={navigateMonth}
              isMobile={isMobile}
            />
          )}
        </div>
      </div>

      <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as Timeframe)}>
        <TabsList>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>

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
            <TabsContent value="monthly">
              <MonthlySummaryCard
                totalExpenses={data.totalExpenses}
                fairShare={data.fairShare}
                settlement={data.settlement}
                settlementDirection={data.settlementDirection}
              />
              <AnalyticsCharts
                userComparison={data.userComparison}
                categoryBreakdown={data.categoryBreakdown}
                locationBreakdown={data.locationBreakdown}
                colors={COLORS}
                users={users}
              />
            </TabsContent>
            <TabsContent value="quarterly">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <TrendsChart title="Quarterly Category Trends" data={data.categoryTrends} dataKey="value" xAxisKey="name" />
                <TrendsChart title="Quarterly Location Trends" data={data.locationTrends} dataKey="value" xAxisKey="name" />
              </div>
            </TabsContent>
            <TabsContent value="yearly">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <TrendsChart title="Yearly Category Trends" data={data.categoryTrends} dataKey="value" xAxisKey="name" />
                <TrendsChart title="Yearly Location Trends" data={data.locationTrends} dataKey="value" xAxisKey="name" />
              </div>
            </TabsContent>
          </>
        ) : (
          <div className="flex justify-center p-12">
            <div>No data available for this period.</div>
          </div>
        )}
      </Tabs>
    </div>
  );
};

export default Analytics;

import MonthlySummaryCard from "@/components/analytics/MonthlySummaryCard";
import AnalyticsCharts from "@/components/analytics/AnalyticsCharts";
import MonthNavigator from "@/components/dashboard/MonthNavigator";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TrendsChart from "@/components/analytics/TrendsChart";
import { useAnalytics } from "@/hooks/useAnalytics";
import SpendTrendCard from "@/components/analytics/SpendTrendCard";
import TotalSummaryCard from "@/components/analytics/TotalSummaryCard";
import SearchInsights from "@/components/analytics/SearchInsights";
import TopSpenders from "@/components/analytics/TopSpenders";
import YearEndSummary from "@/components/analytics/YearEndSummary";

const COLORS = [
  "#10b981", // green
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
];

type Timeframe = "monthly" | "quarterly" | "yearly";

const Analytics = () => {
  const {
    year,
    month,
    timeframe,
    analyticsData,
    isAnalyticsLoading,
    analyticsError,
    users,
    navigateMonth,
    setTimeframe,
  } = useAnalytics();
  const isMobile = useIsMobile();

  return (
    <div className="p-4 sm:p-6 pb-20 sm:pb-6">
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

        {isAnalyticsLoading ? (
          <div className="flex justify-center p-12">
            <div>Loading...</div>
          </div>
        ) : analyticsError ? (
          <div className="flex justify-center p-12 text-red-500">
            Error loading data.
          </div>
        ) : analyticsData ? (
          <>
            <TabsContent value="monthly" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MonthlySummaryCard
                  totalExpenses={analyticsData.totalExpenses}
                  settlement={analyticsData.settlement}
                  settlementDirection={analyticsData.settlementDirection}
                />
                <SpendTrendCard
                  trendPercentage={analyticsData.spendTrendPercentage}
                  reason={analyticsData.spendTrendReason}
                />
              </div>
              
              <SearchInsights />
              
              <TopSpenders 
                categories={analyticsData.categoryBreakdown}
                locations={analyticsData.locationBreakdown}
              />
              
              <AnalyticsCharts
                userComparison={analyticsData.userComparison}
                categoryBreakdown={analyticsData.categoryBreakdown}
                locationBreakdown={analyticsData.locationBreakdown}
                colors={COLORS}
                users={users}
              />
            </TabsContent>
            <TabsContent value="quarterly" className="space-y-6">
              <TotalSummaryCard totalExpenses={analyticsData.totalExpenses} />
              
              <SearchInsights />
              
              <TopSpenders 
                categories={analyticsData.categoryBreakdown}
                locations={analyticsData.locationBreakdown}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TrendsChart
                  title="Quarterly Category Trends"
                  data={analyticsData.categoryTrends}
                  dataKey="value"
                  xAxisKey="name"
                />
                <TrendsChart
                  title="Quarterly Location Trends"
                  data={analyticsData.locationTrends}
                  dataKey="value"
                  xAxisKey="name"
                />
              </div>
            </TabsContent>
            <TabsContent value="yearly" className="space-y-6">
              <YearEndSummary year={year} />
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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MonthlyPieChart from "./MonthlyPieChart";
import { CategorySummary, LocationSummary, User } from "@/types";

interface AnalyticsChartsProps {
  userComparison: {
    user1Percentage: number;
    user2Percentage: number;
  };
  categoryBreakdown: CategorySummary[];
  locationBreakdown: LocationSummary[];
  colors: string[];
  users: User[];
}

const AnalyticsCharts = ({ 
  userComparison, 
  categoryBreakdown, 
  locationBreakdown,
  colors,
  users
}: AnalyticsChartsProps) => {
  // Get user names
  const user1Name = users[0]?.username || "User 1";
  const user2Name = users[1]?.username || "User 2";

  // Transform CategorySummary[] to PieChartData[]
  const categoryData = categoryBreakdown.map(category => ({
    name: category.name,
    value: category.percentage
  }));

  // Transform LocationSummary[] to PieChartData[]
  const locationData = locationBreakdown.map(location => ({
    name: location.name,
    value: location.percentage
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {/* User Expense Comparison */}
      <Card>
        <CardHeader className="px-4 sm:px-6 pb-0">
          <CardTitle className="text-sm sm:text-base">User Expense Comparison</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pt-6">
          <MonthlyPieChart 
            title="User Expense Comparison" 
            data={[
              { name: user1Name, value: userComparison?.user1Percentage || 0 },
              { name: user2Name, value: userComparison?.user2Percentage || 0 },
            ]}
            colors={[colors[0], colors[5]]}
          />
        </CardContent>
      </Card>

      {/* Expenses by Category */}
      <Card>
        <CardHeader className="px-4 sm:px-6 pb-0">
          <CardTitle className="text-sm sm:text-base">Expenses by Category</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pt-6">
          <MonthlyPieChart
            title="Expenses by Category"
            data={categoryData}
            colors={colors}
          />
        </CardContent>
      </Card>
      
      {/* Expenses by Location */}
      <Card>
        <CardHeader className="px-4 sm:px-6 pb-0">
          <CardTitle className="text-sm sm:text-base">Expenses by Location</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pt-6">
          <MonthlyPieChart
            title="Expenses by Location"
            data={locationData}
            colors={colors}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsCharts;

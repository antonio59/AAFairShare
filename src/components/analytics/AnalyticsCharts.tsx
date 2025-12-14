import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MonthlyPieChart from "./MonthlyPieChart";
import { CategorySummary, LocationSummary, User } from "@/types";
import { Users, Tags, MapPin } from "lucide-react";

interface AnalyticsChartsProps {
  userComparison: {
    user1Percentage: number;
    user2Percentage: number;
    user1Total: number;
    user2Total: number;
  };
  categoryBreakdown: CategorySummary[];
  locationBreakdown: LocationSummary[];
  colors: string[];
  users: User[];
}

const EmptyState = ({
  icon: Icon,
  message,
}: {
  icon: React.ElementType;
  message: string;
}) => (
  <div className="h-56 sm:h-64 flex flex-col items-center justify-center text-center px-4">
    <Icon className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
    <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
  </div>
);

const AnalyticsCharts = ({
  userComparison,
  categoryBreakdown,
  locationBreakdown,
  colors,
  users,
}: AnalyticsChartsProps) => {
  const user1Name = users[0]?.username || users[0]?.name || "User 1";
  const user2Name = users[1]?.username || users[1]?.name || "User 2";

  const hasUserData =
    (userComparison?.user1Total || 0) > 0 ||
    (userComparison?.user2Total || 0) > 0;
  const hasCategoryData = categoryBreakdown.length > 0;
  const hasLocationData = locationBreakdown.length > 0;

  const categoryData = categoryBreakdown.slice(0, 8).map((category) => ({
    name: category.name,
    value: category.total,
    percentage: category.percentage,
  }));

  const locationData = locationBreakdown.slice(0, 8).map((location) => ({
    name: location.name,
    value: location.total,
    percentage: location.percentage,
  }));

  const userData = hasUserData
    ? [
        {
          name: user1Name,
          value: userComparison?.user1Total || 0,
          percentage: userComparison?.user1Percentage || 0,
        },
        {
          name: user2Name,
          value: userComparison?.user2Total || 0,
          percentage: userComparison?.user2Percentage || 0,
        },
      ].filter((u) => u.value > 0)
    : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {/* User Expense Comparison */}
      <Card>
        <CardHeader className="px-4 sm:px-6 pb-0">
          <CardTitle className="text-sm sm:text-base">
            User Expense Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pt-6">
          {hasUserData && userData.length > 0 ? (
            <MonthlyPieChart data={userData} colors={[colors[0], colors[5]]} />
          ) : (
            <EmptyState
              icon={Users}
              message="Not enough data to compare users this period."
            />
          )}
        </CardContent>
      </Card>

      {/* Expenses by Category */}
      <Card>
        <CardHeader className="px-4 sm:px-6 pb-0">
          <CardTitle className="text-sm sm:text-base">
            Expenses by Category
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pt-6">
          {hasCategoryData ? (
            <MonthlyPieChart data={categoryData} colors={colors} />
          ) : (
            <EmptyState
              icon={Tags}
              message="No category data for this period. Add expenses to see this chart."
            />
          )}
        </CardContent>
      </Card>

      {/* Expenses by Location */}
      <Card>
        <CardHeader className="px-4 sm:px-6 pb-0">
          <CardTitle className="text-sm sm:text-base">
            Expenses by Location
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pt-6">
          {hasLocationData ? (
            <MonthlyPieChart data={locationData} colors={colors} />
          ) : (
            <EmptyState
              icon={MapPin}
              message="No location data for this period. Add expenses to see this chart."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsCharts;

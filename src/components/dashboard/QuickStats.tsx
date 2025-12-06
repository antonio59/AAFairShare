import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Calendar, ShoppingBag } from "lucide-react";
import { format, subMonths, parse } from "date-fns";
import { useMonthData, useCategories } from "@/hooks/useConvexData";
import { DEMO_MODE, demoMonthData, demoCategories } from "@/lib/demoData";

interface QuickStatsProps {
  currentMonth: string; // format: "yyyy-MM"
}

const QuickStats = ({ currentMonth }: QuickStatsProps) => {
  // Parse the current month to get the previous month
  const currentDate = parse(currentMonth, "yyyy-MM", new Date());
  const lastMonth = format(subMonths(currentDate, 1), "yyyy-MM");

  const thisMonthData = useMonthData(currentMonth) || (DEMO_MODE ? demoMonthData : undefined);
  const lastMonthData = useMonthData(lastMonth) || (DEMO_MODE ? demoMonthData : undefined);
  const categories = useCategories() || (DEMO_MODE ? demoCategories : undefined);

  if (!thisMonthData) return null;

  const thisMonthCount = thisMonthData.expenses.length;
  const lastMonthCount = lastMonthData?.expenses.length || 0;
  const thisMonthTotal = thisMonthData.totalExpenses;
  const lastMonthTotal = lastMonthData?.totalExpenses || 0;
  const avgExpenseAmount = thisMonthCount > 0 ? thisMonthTotal / thisMonthCount : 0;

  // Get most frequent category
  const categoryCounts: Record<string, number> = {};
  thisMonthData.expenses.forEach((exp: { categoryId?: string }) => {
    const catId = exp.categoryId;
    if (catId) categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
  });
  const mostFrequentCatId = Object.entries(categoryCounts).sort(([, a], [, b]) => b - a)[0]?.[0];
  const mostFrequentCategory = categories?.find((c) => c._id === mostFrequentCatId)?.name || "N/A";

  const countChange = thisMonthCount - lastMonthCount;
  const totalChange = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5" />Quick Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="h-3 w-3" />Expenses This Month</p>
            <p className="text-2xl font-bold">{thisMonthCount}</p>
            {lastMonthCount > 0 && (
              <p className={`text-xs flex items-center gap-1 ${countChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {countChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(countChange)} vs last month
              </p>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Avg per Expense</p>
            <p className="text-2xl font-bold">£{avgExpenseAmount.toFixed(0)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500 flex items-center gap-1"><ShoppingBag className="h-3 w-3" />Top Category</p>
            <p className="text-lg font-semibold truncate">{mostFrequentCategory}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Monthly Change</p>
            <p className={`text-2xl font-bold ${totalChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {lastMonthTotal === 0 ? 'N/A' : `${totalChange > 0 ? '+' : ''}${totalChange.toFixed(0)}%`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickStats;

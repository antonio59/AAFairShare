import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Calendar, ShoppingBag, Minus } from "lucide-react";
import { format, subMonths, parse } from "date-fns";
import { useMonthData, useCategories } from "@/hooks/useConvexData";
import { DEMO_MODE, demoMonthData, demoPrevMonthData } from "@/lib/demoData";

interface QuickStatsProps {
  currentMonth: string; // format: "yyyy-MM"
}

const QuickStats = ({ currentMonth }: QuickStatsProps) => {
  const currentDate = parse(currentMonth, "yyyy-MM", new Date());
  const lastMonth = format(subMonths(currentDate, 1), "yyyy-MM");

  const thisMonthData = useMonthData(currentMonth) || (DEMO_MODE ? demoMonthData : undefined);
  const lastMonthData = useMonthData(lastMonth) || (DEMO_MODE ? demoPrevMonthData : undefined);
  const categories = useCategories();

  if (!thisMonthData) return null;

  const thisMonthCount = thisMonthData.expenses.length;
  const lastMonthCount = lastMonthData?.expenses.length || 0;
  const thisMonthTotal = thisMonthData.totalExpenses;
  const lastMonthTotal = lastMonthData?.totalExpenses || 0;
  const avgExpenseAmount = thisMonthCount > 0 ? thisMonthTotal / thisMonthCount : 0;

  const categoryCounts: Record<string, number> = {};
  thisMonthData.expenses.forEach((exp: { categoryId?: string; category?: string }) => {
    const key = exp.categoryId || exp.category;
    if (key) categoryCounts[key] = (categoryCounts[key] || 0) + 1;
  });
  const mostFrequentKey = Object.entries(categoryCounts).sort(([, a], [, b]) => b - a)[0]?.[0];
  const mostFrequentCategory =
    categories?.find((c) => c._id === mostFrequentKey)?.name ||
    mostFrequentKey ||
    "N/A";

  const countChange = thisMonthCount - lastMonthCount;
  const totalChange =
    lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : null;

  const changeTone = (value: number) => {
    if (value > 0) return "text-red-600";
    if (value < 0) return "text-green-600";
    return "text-muted-foreground";
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5" />Quick Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />Transactions This Month</p>
            <p className="text-2xl font-bold">{thisMonthCount}</p>
            {lastMonthData && (
              <p className={`text-xs flex items-center gap-1 ${changeTone(countChange)}`}>
                {countChange > 0 ? <TrendingUp className="h-3 w-3" /> : countChange < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                {countChange === 0 ? "Same as last month" : `${countChange > 0 ? "+" : "-"}${Math.abs(countChange)} vs last month`}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Avg per Expense</p>
            <p className="text-2xl font-bold">£{avgExpenseAmount.toFixed(0)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><ShoppingBag className="h-3 w-3" />Top Category</p>
            <p className="text-lg font-semibold truncate">{mostFrequentCategory}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Monthly Change</p>
            <p className={`text-2xl font-bold ${totalChange === null ? "text-muted-foreground" : changeTone(totalChange)}`}>
              {totalChange === null ? "N/A" : `${totalChange > 0 ? "+" : ""}${totalChange.toFixed(0)}%`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickStats;

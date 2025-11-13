import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Calendar, ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPocketBase } from "@/integrations/pocketbase/client";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

interface QuickStatsData {
  thisMonthCount: number;
  lastMonthCount: number;
  thisMonthTotal: number;
  lastMonthTotal: number;
  avgExpenseAmount: number;
  mostFrequentCategory: string;
}

const QuickStats = () => {
  const { data: stats } = useQuery({
    queryKey: ["quickStats"],
    queryFn: async (): Promise<QuickStatsData> => {
      const pb = await getPocketBase();
      const now = new Date();
      const thisMonthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const thisMonthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
      const lastMonthStart = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');
      const lastMonthEnd = format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');

      // Get this month's expenses
      const thisMonthExpenses: any[] = await pb.collection('expenses').getFullList({
        filter: `date >= "${thisMonthStart}" && date <= "${thisMonthEnd}"`,
        fields: 'amount,category_id'
      })

      // Get last month's expenses
      const lastMonthExpenses: any[] = await pb.collection('expenses').getFullList({
        filter: `date >= "${lastMonthStart}" && date <= "${lastMonthEnd}"`,
        fields: 'amount'
      })

      const thisMonthCount = thisMonthExpenses?.length || 0;
      const lastMonthCount = lastMonthExpenses?.length || 0;
      const thisMonthTotal = thisMonthExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
      const lastMonthTotal = lastMonthExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
      const avgExpenseAmount = thisMonthCount > 0 ? thisMonthTotal / thisMonthCount : 0;

      // Get most frequent category
      const categoryCounts: Record<string, number> = {};
      thisMonthExpenses?.forEach((exp: any) => {
        const catId = exp.category_id;
        if (catId) {
          categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
        }
      });

      const mostFrequentCatId = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0];

      let mostFrequentCategory = "N/A";
      if (mostFrequentCatId) {
        try {
          const catData: any = await pb.collection('categories').getOne(mostFrequentCatId, { fields: 'name' })
          mostFrequentCategory = catData?.name || 'N/A'
        } catch (_) {
          mostFrequentCategory = 'N/A'
        }
      }

      return {
        thisMonthCount,
        lastMonthCount,
        thisMonthTotal,
        lastMonthTotal,
        avgExpenseAmount,
        mostFrequentCategory,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (!stats) return null;

  const countChange = stats.thisMonthCount - stats.lastMonthCount;
  const totalChange = ((stats.thisMonthTotal - stats.lastMonthTotal) / stats.lastMonthTotal) * 100;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Quick Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Expenses This Month
            </p>
            <p className="text-2xl font-bold">{stats.thisMonthCount}</p>
            {stats.lastMonthCount > 0 && (
              <p className={`text-xs flex items-center gap-1 ${countChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {countChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(countChange)} vs last month
              </p>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs text-gray-500">Avg per Expense</p>
            <p className="text-2xl font-bold">£{stats.avgExpenseAmount.toFixed(0)}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <ShoppingBag className="h-3 w-3" />
              Top Category
            </p>
            <p className="text-lg font-semibold truncate">{stats.mostFrequentCategory}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-gray-500">Monthly Change</p>
            <p className={`text-2xl font-bold ${isNaN(totalChange) ? 'text-gray-700' : totalChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {isNaN(totalChange) ? 'N/A' : `${totalChange > 0 ? '+' : ''}${totalChange.toFixed(0)}%`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickStats;

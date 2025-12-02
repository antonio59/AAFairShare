import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Calendar, Award, Wallet, Users } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface YearEndSummaryProps {
  year: number;
}

const YearEndSummary = ({ year }: YearEndSummaryProps) => {
  const users = useQuery(api.users.getAll);
  
  // Get data for all 12 months
  const months = Array.from({ length: 12 }, (_, i) => {
    const monthStr = `${year}-${String(i + 1).padStart(2, "0")}`;
    return monthStr;
  });

  const jan = useQuery(api.monthData.getMonthData, { month: `${year}-01` });
  const feb = useQuery(api.monthData.getMonthData, { month: `${year}-02` });
  const mar = useQuery(api.monthData.getMonthData, { month: `${year}-03` });
  const apr = useQuery(api.monthData.getMonthData, { month: `${year}-04` });
  const may = useQuery(api.monthData.getMonthData, { month: `${year}-05` });
  const jun = useQuery(api.monthData.getMonthData, { month: `${year}-06` });
  const jul = useQuery(api.monthData.getMonthData, { month: `${year}-07` });
  const aug = useQuery(api.monthData.getMonthData, { month: `${year}-08` });
  const sep = useQuery(api.monthData.getMonthData, { month: `${year}-09` });
  const oct = useQuery(api.monthData.getMonthData, { month: `${year}-10` });
  const nov = useQuery(api.monthData.getMonthData, { month: `${year}-11` });
  const dec = useQuery(api.monthData.getMonthData, { month: `${year}-12` });

  const allMonths = [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec];
  const isLoading = allMonths.some(m => m === undefined);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Loading year summary...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const monthData = allMonths.filter(Boolean);
  
  // Calculate totals
  const totalSpent = monthData.reduce((sum, m) => sum + (m?.totalExpenses || 0), 0);
  const user1Total = monthData.reduce((sum, m) => sum + (m?.user1Paid || 0), 0);
  const user2Total = monthData.reduce((sum, m) => sum + (m?.user2Paid || 0), 0);
  const totalExpenses = monthData.reduce((sum, m) => sum + (m?.expenses?.length || 0), 0);

  // Find highest spending month
  const monthlyTotals = monthData.map((m, i) => ({
    month: i,
    total: m?.totalExpenses || 0,
    name: new Date(year, i).toLocaleString('default', { month: 'long' }),
  }));
  const highestMonth = monthlyTotals.reduce((max, m) => m.total > max.total ? m : max, monthlyTotals[0]);
  const lowestMonth = monthlyTotals.filter(m => m.total > 0).reduce((min, m) => m.total < min.total ? m : min, monthlyTotals.find(m => m.total > 0) || monthlyTotals[0]);

  // Calculate category breakdown across the year
  const categoryTotals: Record<string, number> = {};
  monthData.forEach(m => {
    m?.expenses?.forEach(exp => {
      const cat = exp.category || "Uncategorized";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + exp.amount;
    });
  });

  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Monthly averages
  const avgMonthly = totalSpent / 12;

  const user1Name = users?.[0]?.username || users?.[0]?.name || "User 1";
  const user2Name = users?.[1]?.username || users?.[1]?.name || "User 2";

  return (
    <div className="space-y-6">
      {/* Year Overview Header */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {year} Year in Review
          </CardTitle>
          <CardDescription>Your complete spending summary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-card rounded-lg">
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold text-primary">£{totalSpent.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-card rounded-lg">
              <p className="text-sm text-muted-foreground">Monthly Average</p>
              <p className="text-2xl font-bold">£{avgMonthly.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-card rounded-lg">
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold">{totalExpenses}</p>
            </div>
            <div className="p-4 bg-card rounded-lg">
              <p className="text-sm text-muted-foreground">Avg per Expense</p>
              <p className="text-2xl font-bold">£{totalExpenses > 0 ? (totalSpent / totalExpenses).toFixed(2) : '0.00'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contribution Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="font-medium">{user1Name}</span>
                <div className="text-right">
                  <p className="font-bold text-green-600 dark:text-green-400">£{user1Total.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{totalSpent > 0 ? ((user1Total / totalSpent) * 100).toFixed(1) : 50}%</p>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="font-medium">{user2Name}</span>
                <div className="text-right">
                  <p className="font-bold text-blue-600 dark:text-blue-400">£{user2Total.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{totalSpent > 0 ? ((user2Total / totalSpent) * 100).toFixed(1) : 50}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4" />
              Top Spending Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topCategories.map(([category, amount], i) => (
                <div key={category} className="flex justify-between items-center p-2 rounded-lg hover:bg-muted">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}.</span>
                    <span className="text-sm">{category}</span>
                  </div>
                  <span className="font-semibold">£{amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Highs and Lows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-red-600 dark:text-red-400">
              <TrendingUp className="h-4 w-4" />
              Highest Spending Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{highestMonth.name}</p>
            <p className="text-muted-foreground">£{highestMonth.total.toFixed(2)} spent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-green-600 dark:text-green-400">
              <TrendingDown className="h-4 w-4" />
              Lowest Spending Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{lowestMonth?.name || '-'}</p>
            <p className="text-muted-foreground">£{lowestMonth?.total.toFixed(2) || '0.00'} spent</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Spending Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-32">
            {monthlyTotals.map((m, i) => {
              const maxTotal = Math.max(...monthlyTotals.map(mt => mt.total));
              const height = maxTotal > 0 ? (m.total / maxTotal) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                    style={{ height: `${height}%`, minHeight: m.total > 0 ? '4px' : '0' }}
                    title={`${m.name}: £${m.total.toFixed(2)}`}
                  />
                  <span className="text-xs text-muted-foreground">
                    {m.name.substring(0, 1)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default YearEndSummary;

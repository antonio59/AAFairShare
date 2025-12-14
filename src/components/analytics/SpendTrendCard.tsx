import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface SpendTrendCardProps {
  trendPercentage: number;
  reason: string;
  previousMonthTotal?: number;
}

const SpendTrendCard = ({
  trendPercentage,
  reason,
  previousMonthTotal,
}: SpendTrendCardProps) => {
  const isUp = trendPercentage > 0;
  const isDown = trendPercentage < 0;
  const trendColor = isUp
    ? "text-red-500"
    : isDown
      ? "text-green-500"
      : "text-gray-500";
  const TrendIcon = isUp ? ArrowUp : isDown ? ArrowDown : Minus;

  const getReasonText = () => {
    switch (reason) {
      case "no_spending_both":
        return "No spending in either period.";
      case "new_spending":
        return "New spending this month compared to no spending last month.";
      case "no_spending_current":
        return "No spending this month compared to last month.";
      case "increased":
        return "Spending is up compared to last month.";
      case "decreased":
        return "Spending is down compared to last month.";
      case "unchanged":
        return "Spending is unchanged from last month.";
      default:
        return "";
    }
  };

  const formatPercentage = () => {
    if (reason === "no_spending_both") return "0%";
    if (reason === "new_spending") return "+100%";
    if (reason === "no_spending_current") return "-100%";
    const sign = trendPercentage > 0 ? "+" : "";
    return `${sign}${Math.abs(trendPercentage).toFixed(1)}%`;
  };

  return (
    <Card className="@container">
      <CardHeader>
        <CardTitle>Spend Trend vs. Last Month</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center text-center gap-3">
          <div className="flex items-center gap-2">
            <TrendIcon className={`h-8 w-8 @md:h-10 @md:w-10 ${trendColor}`} />
            <span className={`text-3xl @md:text-4xl font-bold ${trendColor}`}>
              {formatPercentage()}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {getReasonText()}
          </p>
          {previousMonthTotal !== undefined && previousMonthTotal > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Last month: £{previousMonthTotal.toFixed(2)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SpendTrendCard;

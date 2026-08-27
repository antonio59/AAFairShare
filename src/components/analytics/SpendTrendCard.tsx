import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/money";
import { ArrowUp, ArrowDown, Minus, Sparkles } from "lucide-react";

interface SpendTrendCardProps {
  trendPercentage: number | null;
  reason: string;
  previousMonthTotal?: number;
}

const SpendTrendCard = ({
  trendPercentage,
  reason,
  previousMonthTotal,
}: SpendTrendCardProps) => {
  const isPending = reason === "pending";
  const isNew = reason === "new_spending";
  const isUp = !isPending && !isNew && (trendPercentage ?? 0) > 0;
  const isDown = !isPending && !isNew && (trendPercentage ?? 0) < 0;
  const trendColor = isPending
    ? "text-muted-foreground"
    : isNew
      ? "text-blue-500"
      : isUp
        ? "text-red-500"
        : isDown
          ? "text-green-500"
          : "text-muted-foreground";
  const TrendIcon = isPending ? Minus : isNew ? Sparkles : isUp ? ArrowUp : isDown ? ArrowDown : Minus;

  const getReasonText = () => {
    switch (reason) {
      case "pending":
        return "Comparing to last month…";
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
    if (reason === "pending") return "—";
    if (reason === "no_spending_both") return "0%";
    if (reason === "new_spending") return "New";
    if (reason === "no_spending_current") return "-100%";
    if (trendPercentage === null) return "—";
    return `${trendPercentage > 0 ? "+" : ""}${trendPercentage.toFixed(1)}%`;
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
          <p className="text-sm text-muted-foreground">
            {getReasonText()}
          </p>
          {previousMonthTotal !== undefined && previousMonthTotal > 0 && (
            <p className="text-xs text-muted-foreground">
              Last month: {formatCurrency(previousMonthTotal)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SpendTrendCard;

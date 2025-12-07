import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface SpendTrendCardProps {
  trendPercentage: number;
  reason: string;
}

const SpendTrendCard = ({ trendPercentage, reason }: SpendTrendCardProps) => {
  const isUp = trendPercentage > 0;
  const isDown = trendPercentage < 0;
  const trendColor = isUp ? "text-red-500" : isDown ? "text-green-500" : "text-gray-500";
  const TrendIcon = isUp ? ArrowUp : isDown ? ArrowDown : Minus;

  return (
    <Card className="@container">
      <CardHeader>
        <CardTitle>Spend Trend vs. Last Period</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col @sm:flex-row items-center justify-center text-center gap-2 @sm:gap-4">
          <div className="flex items-center">
            <TrendIcon className={`h-8 w-8 @md:h-10 @md:w-10 ${trendColor}`} />
            <span className={`text-3xl @md:text-4xl font-bold ml-2 ${trendColor}`}>
              {Math.abs(trendPercentage)}%
            </span>
          </div>
          {reason && (
            <p className="text-sm text-gray-500">
              Mainly due to <span className="font-semibold">{reason}</span> spending.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SpendTrendCard;
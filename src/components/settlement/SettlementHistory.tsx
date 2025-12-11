import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useUsers } from "@/hooks/useConvexData";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { format, parse } from "date-fns";
import { ArrowRight } from "lucide-react";

interface SettlementHistoryProps {
  monthString: string;
}

const formatMonthLabel = (monthStr: string): string => {
  try {
    const date = parse(monthStr, "yyyy-MM", new Date());
    return format(date, "MMM yyyy");
  } catch {
    return monthStr;
  }
};

const SettlementHistory = ({ monthString }: SettlementHistoryProps) => {
  const users = useUsers() ?? [];
  const settlements = useQuery(api.settlements.getAll) ?? [];
  
  const recentSettlements = settlements.slice(0, 10);

  const getUserName = (userId: string) => {
    const user = users.find(u => u._id === userId);
    return user?.username || "Unknown";
  };

  if (recentSettlements.length === 0) {
    return null;
  }

  return (
    <Card className="border-t-4 border-t-gray-200 dark:border-t-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Settlement History</CardTitle>
        <CardDescription>Previous months' settlements</CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4">
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <th className="pb-2 font-medium">Month</th>
                <th className="pb-2 font-medium">Payment</th>
                <th className="pb-2 font-medium text-right">Amount</th>
                <th className="pb-2 font-medium text-right hidden sm:table-cell">Settled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentSettlements.map((settlement) => (
                <tr key={settlement._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="py-3 pr-4">
                    <span className="font-medium text-sm">{formatMonthLabel(settlement.month)}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                      <span>{getUserName(settlement.fromUserId)}</span>
                      <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <span>{getUserName(settlement.toUserId)}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className="font-semibold text-sm">£{settlement.amount.toFixed(2)}</span>
                  </td>
                  <td className="py-3 text-right hidden sm:table-cell">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(settlement.date), "MMM d, yyyy")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="sm:hidden space-y-3">
          {recentSettlements.map((settlement) => (
            <div 
              key={`mobile-${settlement._id}`}
              className="flex flex-col p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-2"
            >
              <div className="flex justify-between items-start">
                <span className="font-medium text-sm">{formatMonthLabel(settlement.month)}</span>
                <span className="font-semibold text-sm">£{settlement.amount.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                <span>{getUserName(settlement.fromUserId)}</span>
                <ArrowRight className="h-3 w-3 text-gray-400" />
                <span>{getUserName(settlement.toUserId)}</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Settled on {format(new Date(settlement.date), "MMM d, yyyy")}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SettlementHistory;

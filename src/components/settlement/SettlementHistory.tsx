import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUsers } from "@/hooks/useConvexData";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { format } from "date-fns";

interface SettlementHistoryProps {
  monthString: string;
}

const SettlementHistory = ({ monthString }: SettlementHistoryProps) => {
  const users = useUsers() ?? [];
  const settlements = useQuery(api.settlements.getAll) ?? [];
  
  const recentSettlements = settlements.slice(0, 5);

  const getUserName = (userId: string) => {
    const user = users.find(u => u._id === userId);
    return user?.username || "Unknown";
  };

  if (recentSettlements.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader><CardTitle>Settlement History</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentSettlements.map((settlement) => (
            <div key={settlement._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">{settlement.month}</p>
                <p className="text-sm text-gray-500">
                  {getUserName(settlement.fromUserId)} paid {getUserName(settlement.toUserId)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">£{settlement.amount.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{format(new Date(settlement.date), "MMM d, yyyy")}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SettlementHistory;

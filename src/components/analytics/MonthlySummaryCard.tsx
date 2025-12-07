import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUsers } from "@/hooks/useConvexData";

interface MonthlySummaryCardProps {
  totalExpenses: number;
  settlement: number;
  settlementDirection: "owes" | "owed" | "even";
}

const MonthlySummaryCard = ({ totalExpenses, settlement, settlementDirection }: MonthlySummaryCardProps) => {
  const users = useUsers() ?? [];
  const user1Name = users[0]?.username || users[0]?.name || "User 1";
  const user2Name = users[1]?.username || users[1]?.name || "User 2";

  const getSettlementText = () => {
    if (settlementDirection === "even") return "All settled up!";
    const fromUser = settlementDirection === "owes" ? user1Name : user2Name;
    const toUser = settlementDirection === "owes" ? user2Name : user1Name;
    return `${fromUser} owes ${toUser}`;
  };

  return (
    <Card className="@container">
      <CardHeader><CardTitle>Monthly Summary</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col @xs:flex-row @xs:justify-between @xs:items-center gap-1">
          <span className="text-gray-600">Total Expenses</span>
          <span className="text-xl @sm:text-2xl font-bold">£{totalExpenses.toFixed(2)}</span>
        </div>
        <div className="flex flex-col @xs:flex-row @xs:justify-between @xs:items-center gap-1">
          <span className="text-gray-600">Fair Share (each)</span>
          <span className="text-lg @sm:text-xl font-semibold">£{(totalExpenses / 2).toFixed(2)}</span>
        </div>
        <div className="border-t pt-4">
          <p className="text-sm text-gray-500 mb-1">{getSettlementText()}</p>
          <p className="text-2xl @sm:text-3xl font-bold text-primary">£{settlement.toFixed(2)}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlySummaryCard;

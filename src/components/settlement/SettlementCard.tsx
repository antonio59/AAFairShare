import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUsers } from "@/hooks/useConvexData";
import { CheckCircle } from "lucide-react";

interface MonthData {
  totalExpenses: number;
  fairShare: number;
  settlement: number;
  settlementDirection: "owes" | "owed" | "even";
  user1Paid: number;
  user2Paid: number;
  expenses: unknown[];
}

interface SettlementCardProps {
  monthData: MonthData | null | undefined;
  isSettling: boolean;
  isUnsettling: boolean;
  settlementExists: boolean;
  onSettlement: () => void;
  onUnsettlement: () => void;
}

const SettlementCard = ({ monthData, isSettling, isUnsettling, settlementExists, onSettlement, onUnsettlement }: SettlementCardProps) => {
  const users = useUsers() ?? [];
  const user1 = users[0] || { username: "User 1", photoUrl: "", image: "" };
  const user2 = users[1] || { username: "User 2", photoUrl: "", image: "" };
  const user1Name = user1.username || user1.name || "User 1";
  const user2Name = user2.username || user2.name || "User 2";
  const user1Avatar = user1.photoUrl || user1.image || "";
  const user2Avatar = user2.photoUrl || user2.image || "";

  if (!monthData) return null;

  const { settlement, settlementDirection } = monthData;
  const fromUser = settlementDirection === "owes" ? user1Name : user2Name;
  const toUser = settlementDirection === "owes" ? user2Name : user1Name;
  const fromAvatar = settlementDirection === "owes" ? user1Avatar : user2Avatar;
  const toAvatar = settlementDirection === "owes" ? user2Avatar : user1Avatar;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Settlement
          {settlementExists && <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" />Settled</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {settlement === 0 || settlementDirection === "even" ? (
          <p className="text-lg text-center text-gray-600">All settled up! No payments needed.</p>
        ) : (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-lg">
              <Avatar className="h-6 w-6">
                <AvatarImage src={fromAvatar} alt={fromUser} />
                <AvatarFallback className="text-xs">{fromUser.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-semibold">{fromUser}</span>
              <span>owes</span>
              <Avatar className="h-6 w-6">
                <AvatarImage src={toAvatar} alt={toUser} />
                <AvatarFallback className="text-xs">{toUser.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-semibold">{toUser}</span>
            </div>
            <p className="text-3xl font-bold text-primary mt-2">£{settlement.toFixed(2)}</p>
          </div>
        )}
        
        {!settlementExists && settlement > 0 && (
          <Button onClick={onSettlement} disabled={isSettling} className="w-full">
            {isSettling ? "Processing..." : "Mark as Settled"}
          </Button>
        )}
        
        {settlementExists && (
          <Button onClick={onUnsettlement} disabled={isUnsettling} variant="outline" className="w-full">
            {isUnsettling ? "Processing..." : "Undo Settlement"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default SettlementCard;

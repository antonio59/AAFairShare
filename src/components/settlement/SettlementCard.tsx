import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useUsers } from "@/hooks/useConvexData";
import { CheckCircle, ArrowRight } from "lucide-react";

interface MonthData {
  totalExpenses: number;
  fairShare: number;
  settlement: number;
  settlementDirection: "owes" | "owed" | "even";
  user1Paid: number;
  user2Paid: number;
  expenses: unknown[];
  sharedExpensesTotal?: number;
  eachPersonsShare?: number;
  user1PersonalExpenses?: number;
  user2PersonalExpenses?: number;
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
  const user1 = users[0] || { username: "User 1", image: "" };
  const user2 = users[1] || { username: "User 2", image: "" };
  const user1Name = user1.username || user1.name || "User 1";
  const user2Name = user2.username || user2.name || "User 2";
  const user1Avatar = user1.image || "";
  const user2Avatar = user2.image || "";

  if (!monthData) return null;

  const { 
    settlement, 
    settlementDirection, 
    user1Paid, 
    user2Paid, 
    sharedExpensesTotal = 0, 
    eachPersonsShare = 0,
    user1PersonalExpenses = 0,
    user2PersonalExpenses = 0
  } = monthData;
  const fromName = settlementDirection === "owes" ? user1Name : user2Name;
  const toName = settlementDirection === "owes" ? user2Name : user1Name;
  const fromAvatar = settlementDirection === "owes" ? user1Avatar : user2Avatar;
  const toAvatar = settlementDirection === "owes" ? user2Avatar : user1Avatar;
  
  const hasPersonalExpenses = user1PersonalExpenses > 0 || user2PersonalExpenses > 0;

  return (
    <Card className="@container">
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
            <div className="flex items-center justify-center gap-3 @sm:gap-4">
              <Avatar className="h-10 w-10 @sm:h-12 @sm:w-12">
                <AvatarImage src={fromAvatar} alt={fromName} />
                <AvatarFallback>{fromName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500">owes</span>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
              <Avatar className="h-10 w-10 @sm:h-12 @sm:w-12">
                <AvatarImage src={toAvatar} alt={toName} />
                <AvatarFallback>{toName.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
            <p className="text-3xl @sm:text-4xl font-bold text-primary mt-3">£{settlement.toFixed(2)}</p>
            
            <Separator className="my-4" />
            
            <div className="text-left space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Breakdown</h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Total paid by {user1Name}:</span>
                  <span className="font-medium">£{user1Paid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total paid by {user2Name}:</span>
                  <span className="font-medium">£{user2Paid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shared expenses (50/50):</span>
                  <span className="font-medium">£{sharedExpensesTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Each person's share:</span>
                  <span className="font-medium">£{eachPersonsShare.toFixed(2)}</span>
                </div>
                {hasPersonalExpenses && (
                  <div className="flex justify-between">
                    <span>Personal expenses (not split):</span>
                    <span className="font-medium">
                      {user1PersonalExpenses > 0 && `£${user1PersonalExpenses.toFixed(2)} (${user1Name})`}
                      {user1PersonalExpenses > 0 && user2PersonalExpenses > 0 && ", "}
                      {user2PersonalExpenses > 0 && `£${user2PersonalExpenses.toFixed(2)} (${user2Name})`}
                    </span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold text-gray-800 dark:text-gray-200">
                  <span>Net amount {fromName} owes {toName}:</span>
                  <span>£{settlement.toFixed(2)}</span>
                </div>
              </div>
            </div>
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

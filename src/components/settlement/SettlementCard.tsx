import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/money";
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
  creditLines?: CreditLine[];
}

interface CreditLine {
  allocationId: string;
  label: string;
  kind: "bill" | "payout";
  expenseDescription: string | null;
  holderName: string;
  otherName: string;
  amount: number;
  adjustment: number;
}

interface RecordedSettlement {
  amount: number;
  fromUserId: string;
  toUserId: string;
}

interface SettlementCardProps {
  monthData: MonthData | null | undefined;
  isSettling: boolean;
  isUnsettling: boolean;
  settlementExists: boolean;
  recordedSettlement?: RecordedSettlement | null;
  driftMessage?: string | null;
  onSettlement: () => void;
  onUnsettlement: () => void;
}

const SettlementCard = ({ monthData, isSettling, isUnsettling, settlementExists, recordedSettlement, driftMessage, onSettlement, onUnsettlement }: SettlementCardProps) => {
  const users = useUsers() ?? [];
  const user1Name = users[0]?.username || users[0]?.name || "User 1";
  const user2Name = users[1]?.username || users[1]?.name || "User 2";
  const user1Avatar = users[0]?.image || "";
  const user2Avatar = users[1]?.image || "";

  if (!monthData) return null;

  const { 
    settlement, 
    settlementDirection, 
    user1Paid, 
    user2Paid, 
    sharedExpensesTotal = 0, 
    eachPersonsShare = 0,
    user1PersonalExpenses = 0,
    user2PersonalExpenses = 0,
    creditLines = [],
  } = monthData;
  const recordedFrom = users.find((user) => user._id === recordedSettlement?.fromUserId);
  const recordedTo = users.find((user) => user._id === recordedSettlement?.toUserId);
  const recordedFromName = recordedFrom?.username || recordedFrom?.name || "Someone";
  const recordedToName = recordedTo?.username || recordedTo?.name || "Someone";
  const frozenHeadline = !recordedSettlement
    ? null
    : recordedSettlement.amount === 0
      ? "All square"
      : `${recordedFromName} owes ${recordedToName} ${formatCurrency(recordedSettlement.amount)}`;

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
        {settlementExists && frozenHeadline && (
          <p className="text-center text-lg font-semibold">{frozenHeadline}</p>
        )}
        {driftMessage && (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {driftMessage}
          </p>
        )}
        {!settlementExists && (settlement === 0 || settlementDirection === "even") ? (
          <p className="text-lg text-center text-muted-foreground">All settled up! No payments needed.</p>
        ) : !settlementExists ? (
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 @sm:gap-4">
              <Avatar className="h-10 w-10 @sm:h-12 @sm:w-12">
                <AvatarImage src={fromAvatar} alt={fromName} />
                <AvatarFallback>{fromName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-center">
                <span className="text-xs text-muted-foreground">owes</span>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <Avatar className="h-10 w-10 @sm:h-12 @sm:w-12">
                <AvatarImage src={toAvatar} alt={toName} />
                <AvatarFallback>{toName.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
            <p className="text-3xl @sm:text-4xl font-bold text-primary mt-3">{formatCurrency(settlement)}</p>
            
            <Separator className="my-4" />
            
            <div className="text-left space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Breakdown</h4>
              {creditLines.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Amounts paid are the full bills. Refund credit is shown on its own below.
                </p>
              )}
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Total paid by {user1Name}:</span>
                  <span className="font-medium">{formatCurrency(user1Paid)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total paid by {user2Name}:</span>
                  <span className="font-medium">{formatCurrency(user2Paid)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shared expenses (50/50):</span>
                  <span className="font-medium">{formatCurrency(sharedExpensesTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Each person's share:</span>
                  <span className="font-medium">{formatCurrency(eachPersonsShare)}</span>
                </div>
                {hasPersonalExpenses && (
                  <div className="flex justify-between">
                    <span>Paid for the other (100% theirs):</span>
                    <span className="font-medium">
                      {user1PersonalExpenses > 0 && `£${user1PersonalExpenses.toFixed(2)} (${user1Name})`}
                      {user1PersonalExpenses > 0 && user2PersonalExpenses > 0 && ", "}
                      {user2PersonalExpenses > 0 && `£${user2PersonalExpenses.toFixed(2)} (${user2Name})`}
                    </span>
                  </div>
                )}
                {creditLines.length > 0 && (
                  <div className="mt-2 space-y-1 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2">
                    <p className="text-xs font-semibold text-foreground">Refund credit</p>
                    {creditLines.map((line) => (
                      <div key={line.allocationId} className="flex justify-between gap-3">
                        <span>
                          {line.kind === "payout"
                            ? `${line.label} cashed out (${formatCurrency(line.amount)})`
                            : `${line.label} on ${line.expenseDescription} (${formatCurrency(line.amount)})`}
                          : {line.holderName} owes {line.otherName} half
                        </span>
                        <span className="font-medium whitespace-nowrap">+{formatCurrency(line.adjustment)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold text-foreground">
                  <span>Net amount {fromName} owes {toName}:</span>
                  <span>{formatCurrency(settlement)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        
        {!settlementExists && (
          <Button onClick={onSettlement} disabled={isSettling} className="w-full">
            {isSettling ? "Processing..." : settlement > 0 ? "Mark as Settled" : "Mark month as settled"}
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

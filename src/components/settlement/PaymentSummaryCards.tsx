import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/money";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUsers } from "@/hooks/useConvexData";

interface PaymentSummaryCardsProps {
  user1Paid: number;
  user2Paid: number;
}

const PaymentSummaryCards = ({ user1Paid, user2Paid }: PaymentSummaryCardsProps) => {
  const users = useUsers() ?? [];
  const user1Name = users[0]?.username || users[0]?.name || "User 1";
  const user2Name = users[1]?.username || users[1]?.name || "User 2";
  const user1Avatar = users[0]?.image || "";
  const user2Avatar = users[1]?.image || "";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user1Avatar} alt={user1Name} />
              <AvatarFallback className="text-xs">{user1Name.charAt(0)}</AvatarFallback>
            </Avatar>
            Paid
          </CardTitle>
        </CardHeader>
        <CardContent><p className="text-2xl font-bold text-green-600">{formatCurrency(user1Paid)}</p></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user2Avatar} alt={user2Name} />
              <AvatarFallback className="text-xs">{user2Name.charAt(0)}</AvatarFallback>
            </Avatar>
            Paid
          </CardTitle>
        </CardHeader>
        <CardContent><p className="text-2xl font-bold text-primary">{formatCurrency(user2Paid)}</p></CardContent>
      </Card>
    </div>
  );
};

export default PaymentSummaryCards;

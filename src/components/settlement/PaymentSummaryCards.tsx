import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUsers } from "@/hooks/useConvexData";

interface PaymentSummaryCardsProps {
  user1Paid: number;
  user2Paid: number;
}

const PaymentSummaryCards = ({ user1Paid, user2Paid }: PaymentSummaryCardsProps) => {
  const users = useUsers() ?? [];
  const user1 = users[0] || { username: "User 1", photoUrl: "", image: "" };
  const user2 = users[1] || { username: "User 2", photoUrl: "", image: "" };
  const user1Name = user1.username || user1.name || "User 1";
  const user2Name = user2.username || user2.name || "User 2";
  const user1Avatar = user1.photoUrl || user1.image || "";
  const user2Avatar = user2.photoUrl || user2.image || "";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user1Avatar} alt={user1Name} />
              <AvatarFallback className="text-xs">{user1Name.charAt(0)}</AvatarFallback>
            </Avatar>
            {user1Name} Paid
          </CardTitle>
        </CardHeader>
        <CardContent><p className="text-2xl font-bold text-green-600">£{user1Paid.toFixed(2)}</p></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user2Avatar} alt={user2Name} />
              <AvatarFallback className="text-xs">{user2Name.charAt(0)}</AvatarFallback>
            </Avatar>
            {user2Name} Paid
          </CardTitle>
        </CardHeader>
        <CardContent><p className="text-2xl font-bold text-blue-600">£{user2Paid.toFixed(2)}</p></CardContent>
      </Card>
    </div>
  );
};

export default PaymentSummaryCards;

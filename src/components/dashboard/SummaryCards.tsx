import { Card, CardContent } from "@/components/ui/card";
import { useUsers } from "@/hooks/useConvexData";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SummaryCardsProps {
  totalExpenses: number;
  user1Paid: number;
  user2Paid: number;
  settlement: number;
  isMobile?: boolean;
}

const SummaryCards = ({ totalExpenses, user1Paid, user2Paid, settlement, isMobile }: SummaryCardsProps) => {
  const users = useUsers() ?? [];
  
  const user1 = users[0] || { _id: "1", username: "User 1", image: "" };
  const user2 = users[1] || { _id: "2", username: "User 2", image: "" };
  const user1Name = user1.username || user1.name || "User 1";
  const user2Name = user2.username || user2.name || "User 2";
  const user1Avatar = user1.image || "";
  const user2Avatar = user2.image || "";

  const cardClass = isMobile ? "p-3" : "";

  return (
    <div className={`grid ${isMobile ? "grid-cols-2 gap-3" : "grid-cols-4 gap-4"} mb-6`}>
      <Card className={cardClass}>
        <CardContent className={isMobile ? "p-3" : "p-6"}>
          <p className="text-sm text-gray-500 mb-1">Total Expenses</p>
          <p className={`font-bold ${isMobile ? "text-lg" : "text-2xl"}`}>£{totalExpenses.toFixed(2)}</p>
        </CardContent>
      </Card>

      <Card className={cardClass}>
        <CardContent className={isMobile ? "p-3" : "p-6"}>
          <div className="flex items-center gap-2 mb-1">
            <Avatar className="h-5 w-5">
              <AvatarImage src={user1Avatar} alt={user1Name} />
              <AvatarFallback className="text-xs">{user1Name.charAt(0)}</AvatarFallback>
            </Avatar>
            <p className="text-sm text-gray-500">Paid</p>
          </div>
          <p className={`font-bold text-green-600 ${isMobile ? "text-lg" : "text-2xl"}`}>£{user1Paid.toFixed(2)}</p>
        </CardContent>
      </Card>

      <Card className={cardClass}>
        <CardContent className={isMobile ? "p-3" : "p-6"}>
          <div className="flex items-center gap-2 mb-1">
            <Avatar className="h-5 w-5">
              <AvatarImage src={user2Avatar} alt={user2Name} />
              <AvatarFallback className="text-xs">{user2Name.charAt(0)}</AvatarFallback>
            </Avatar>
            <p className="text-sm text-gray-500">Paid</p>
          </div>
          <p className={`font-bold text-blue-600 ${isMobile ? "text-lg" : "text-2xl"}`}>£{user2Paid.toFixed(2)}</p>
        </CardContent>
      </Card>

      <Card className={cardClass}>
        <CardContent className={isMobile ? "p-3" : "p-6"}>
          <p className="text-sm text-gray-500 mb-1">Settlement</p>
          <p className={`font-bold text-primary ${isMobile ? "text-lg" : "text-2xl"}`}>£{settlement.toFixed(2)}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryCards;

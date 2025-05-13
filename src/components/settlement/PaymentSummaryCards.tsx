import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getUsers } from "@/services/expenseService";
import { User } from "@/types";

interface PaymentSummaryCardsProps {
  user1Paid: number;
  user2Paid: number;
}

const PaymentSummaryCards = ({ user1Paid, user2Paid }: PaymentSummaryCardsProps) => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userData = await getUsers();
        setUsers(userData);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };
    
    fetchUsers();
  }, []);

  // Get first two users or create placeholders if not loaded yet
  const user1 = users[0] || { username: "User 1", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user1" };
  const user2 = users[1] || { username: "User 2", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user2" };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden">
              <img
                src={user1.avatar}
                alt={`${user1.username} avatar`}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-base md:text-lg font-medium">{user1.username} Paid</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold">£{user1Paid.toFixed(2)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden">
              <img
                src={user2.avatar}
                alt={`${user2.username} avatar`}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-base md:text-lg font-medium">{user2.username} Paid</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold">£{user2Paid.toFixed(2)}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSummaryCards;

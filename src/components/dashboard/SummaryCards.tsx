import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { getUsers } from "@/services/expenseService";
import { User } from "@/types";

interface SummaryCardsProps {
  totalExpenses: number;
  user1Paid: number;
  user2Paid: number;
  settlement: number;
  isMobile?: boolean;
}

const SummaryCards = ({ 
  totalExpenses, 
  user1Paid, 
  user2Paid, 
  settlement,
  isMobile
}: SummaryCardsProps) => {
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

  // Ensure users array has at least two users, providing fallbacks if not
  // Fallbacks should also use 'username' for consistency
  const user1 = users[0] || { 
    id: "user1_fallback_id", 
    username: "User 1", 
    avatar: `https://ui-avatars.com/api/?name=User+1&background=random` 
  };
  const user2 = users[1] || { 
    id: "user2_fallback_id", 
    username: "User 2", 
    avatar: `https://ui-avatars.com/api/?name=User+2&background=random` 
  };

  // Determine who owes money based on total paid
  // This logic might need adjustment if user1/user2 mapping to actual users isn't fixed
  const payer = user1Paid > user2Paid ? user2 : user1;
  // For the settlement card, display the avatar of the user who needs to pay.
  // If settlement is 0 or negative (meaning no one owes or user1 owes user2 based on typical positive settlement value for user2 to pay user1)
  // we might need a neutral avatar or specific logic for who is displayed.
  // Current logic: if settlement > 0, it implies user2 owes user1 (payer is user2).
  // Let's assume settlement value is always positive and indicates amount one user owes another.
  const settlementPayerAvatar = settlement > 0 ? (user1Paid < user2Paid ? user1.avatar : user2.avatar) : "https://ui-avatars.com/api/?name=Even&background=random";
  const settlementPayerName = settlement > 0 ? (user1Paid < user2Paid ? user1.username : user2.username) : "No one";

  return (
    <div className={`grid ${isMobile ? "grid-cols-2 gap-3 mb-4" : "grid-cols-1 md:grid-cols-4 gap-4 mb-6"}`}>
      <Card>
        <CardContent className={`${isMobile ? "p-4" : "p-6"} flex flex-col`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold">£</span>
            </div>
            <span className="text-sm font-medium text-gray-500">Total</span>
          </div>
          <span className="text-2xl font-bold">£{totalExpenses.toFixed(2)}</span>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className={`${isMobile ? "p-4" : "p-6"} flex flex-col`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <img 
                src={user1.avatar}
                alt={`${user1.username} avatar`}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-sm font-medium text-gray-500">{(user1.username || 'User 1')} Paid</span>
          </div>
          <span className="text-2xl font-bold">£{user1Paid.toFixed(2)}</span>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className={`${isMobile ? "p-4" : "p-6"} flex flex-col`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <img 
                src={user2.avatar}
                alt={`${user2.username} avatar`}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-sm font-medium text-gray-500">{(user2.username || 'User 2')} Paid</span>
          </div>
          <span className="text-2xl font-bold">£{user2Paid.toFixed(2)}</span>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className={`${isMobile ? "p-4" : "p-6"} flex flex-col`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <img 
                src={settlementPayerAvatar} // Use the refined settlementPayerAvatar
                alt={`${settlementPayerName} avatar`} // Use settlementPayerName for alt
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-sm font-medium text-gray-500">Settlement Due</span>
          </div>
          <span className={`text-2xl font-bold ${settlement > 0 ? 'text-green-600' : 'text-gray-700'}`}>£{Math.abs(settlement).toFixed(2)}</span>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryCards;

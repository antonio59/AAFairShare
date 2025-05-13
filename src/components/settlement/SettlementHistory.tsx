import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getSupabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getUsers } from "@/services/expenseService";
import { User } from "@/types";

interface Settlement {
  id: string;
  date: string;
  amount: number;
  from_user_id: string;
  to_user_id: string;
  month: string;
}

interface SettlementHistoryProps {
  onSettlementUpdated?: () => void;
}

const SettlementHistory = ({ onSettlementUpdated }: SettlementHistoryProps) => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch settlements
        const supabase = await getSupabase();
        const { data: settlementsData, error: settlementsError } = await supabase
          .from('settlements')
          .select('*')
          .order('date', { ascending: false });

        if (settlementsError) throw settlementsError;
        
        // Fetch users
        const userData = await getUsers();
        
        setSettlements(settlementsData || []);
        setUsers(userData);
        if (onSettlementUpdated) onSettlementUpdated();
      } catch (error) {
        console.error("Error fetching settlement history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [onSettlementUpdated]);

  // Helper function to get user by ID
  const getUserById = (id: string): User => {
    const user = users.find(u => u.id === id);
    // Ensure fallback user has username, and make avatar consistent if needed
    return user || { 
      id, 
      username: "Unknown User", 
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent("Unknown User")}&background=random` 
    };
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-6">Settlement History</h2>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div>Loading settlement history...</div>
          </div>
        ) : settlements.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            No settlements recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {settlements.map(settlement => {
              const fromUser = getUserById(settlement.from_user_id);
              const toUser = getUserById(settlement.to_user_id);
              
              return (
                <div key={settlement.id} className="border-b pb-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-gray-500">
                      {format(new Date(settlement.date), "MMMM d, yyyy")}
                    </div>
                    <div className="text-sm font-medium">
                      For {settlement.month}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={fromUser.avatar} alt={fromUser.username || 'User'} />
                      <AvatarFallback>{(fromUser.username || '?').charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-gray-600">paid</span>
                    <span className="font-bold">£{settlement.amount.toFixed(2)}</span>
                    <span className="text-gray-600">to</span>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={toUser.avatar} alt={toUser.username || 'User'} />
                      <AvatarFallback>{(toUser.username || '?').charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SettlementHistory;

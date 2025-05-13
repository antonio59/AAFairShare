import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { MonthData, User } from "@/types";
import { getUsers } from "@/services/expenseService";

interface SettlementCardProps {
  monthData: MonthData | undefined;
  isSettling: boolean;
  isUnsettling: boolean;
  settlementExists: boolean;
  onSettlement: () => Promise<void>;
  onUnsettlement: () => Promise<void>;
}

const SettlementCard = ({
  monthData,
  isSettling,
  isUnsettling,
  settlementExists,
  onSettlement,
  onUnsettlement
}: SettlementCardProps) => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userData = await getUsers();
        setUsers(userData);
      } catch (error) {
        console.error("Failed to fetch users for avatars:", error);
      }
    };
    
    fetchUsers();
  }, []);

  // Get avatars - assumes the order from getUsers() matches the user1/user2 concept in monthData
  const avatar1 = users[0]?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=user1";
  const avatar2 = users[1]?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=user2";

  // Get names from monthData if available, with fallbacks
  const name1 = monthData?.user1Name || "User 1";
  const name2 = monthData?.user2Name || "User 2";

  return (
    <Card className="mb-6">
      <CardContent className="p-4 sm:p-6">
        <h2 className="text-xl font-semibold mb-4">
          {monthData ? `${name1} & ${name2}` : 'Current Month'} Settlement
        </h2>

        {monthData && monthData.settlement > 0 ? (
          <div className="flex justify-center mb-6">
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden mb-1">
                    <img
                      src={monthData.settlementDirection === "owes" ? avatar1 : avatar2}
                      alt={`${monthData.settlementDirection === "owes" ? name1 : name2} avatar`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs text-gray-500">{monthData.settlementDirection === "owes" ? name1 : name2}</span>
                </div>
                <span className="text-sm sm:text-base mx-1 sm:mx-2">owes</span>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden mb-1">
                    <img
                      src={monthData.settlementDirection === "owes" ? avatar2 : avatar1}
                      alt={`${monthData.settlementDirection === "owes" ? name2 : name1} avatar`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs text-gray-500">{monthData.settlementDirection === "owes" ? name2 : name1}</span>
                </div>
              </div>
              <div className="text-3xl sm:text-4xl font-bold">
                £{monthData.settlement.toFixed(2)}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-6">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-medium mb-2">
                No Settlement Needed
              </div>
              <div className="text-gray-500 text-sm sm:text-base">
                Expenses are already balanced for this month.
              </div>
            </div>
          </div>
        )}

        {settlementExists ? (
          <Button
            className="w-full py-3 sm:py-4 text-sm sm:text-base"
            variant="destructive"
            size="lg" // Keep size lg for consistent height, but override padding and font
            disabled={isUnsettling}
            onClick={onUnsettlement}
          >
            <X className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            {isUnsettling ? "Processing..." : "Mark as Unsettled"}
          </Button>
        ) : (
          <Button
            className="w-full py-3 sm:py-4 text-sm sm:text-base"
            variant="default"
            size="lg" // Keep size lg for consistent height, but override padding and font
            disabled={!monthData || monthData.settlement === 0 || isSettling}
            onClick={onSettlement}
          >
            <Check className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            {isSettling ? "Processing..." : "Mark as Settled"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default SettlementCard;

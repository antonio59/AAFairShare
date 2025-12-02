import { useState } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  getCurrentYear,
  getCurrentMonth,
  formatMonthString
} from "@/services/utils/dateUtils";
import {
  useMonthData,
  useUsers,
  useSettlementExists,
  useMarkSettlementComplete,
  useMarkSettlementUnsettled
} from "@/hooks/useConvexData";
import { Id } from "../../convex/_generated/dataModel";

import MonthNavigator from "@/components/settlement/MonthNavigator";
import SettlementCard from "@/components/settlement/SettlementCard";
import PaymentSummaryCards from "@/components/settlement/PaymentSummaryCards";
import SettlementHistory from "@/components/settlement/SettlementHistory";

const Settlement = () => {
  const { toast } = useToast();
  const [year, setYear] = useState(getCurrentYear());
  const [month, setMonth] = useState(getCurrentMonth());
  const [isSettling, setIsSettling] = useState(false);
  const [isUnsettling, setIsUnsettling] = useState(false);

  const currentMonthLabel = format(new Date(year, month - 1, 1), "MMMM yyyy");
  const monthString = formatMonthString(year, month);

  const monthData = useMonthData(monthString);
  const users = useUsers() ?? [];
  const settlementExists = useSettlementExists(monthString) ?? false;
  const markSettlementComplete = useMarkSettlementComplete();
  const markSettlementUnsettled = useMarkSettlementUnsettled();

  const isLoading = monthData === undefined;

  const navigateMonth = (direction: "prev" | "next") => {
    let newMonth = month;
    let newYear = year;

    if (direction === "prev") {
      newMonth -= 1;
      if (newMonth === 0) {
        newMonth = 12;
        newYear -= 1;
      }
    } else {
      newMonth += 1;
      if (newMonth === 13) {
        newMonth = 1;
        newYear += 1;
      }
    }

    setMonth(newMonth);
    setYear(newYear);
  };

  const handleSettlement = async () => {
    if (!monthData) return;

    setIsSettling(true);

    try {
      if (users.length < 2) {
        toast({
          title: "Error",
          description: "User data not available to complete settlement.",
          variant: "destructive",
        });
        setIsSettling(false);
        return;
      }

      const user1ActualId = users[0]._id;
      const user2ActualId = users[1]._id;

      const actualFromUserId = monthData.settlementDirection === 'owes' ? user1ActualId : user2ActualId;
      const actualToUserId = actualFromUserId === user1ActualId ? user2ActualId : user1ActualId;

      await markSettlementComplete({
        month: monthString,
        date: format(new Date(), 'yyyy-MM-dd'),
        amount: monthData.settlement,
        fromUserId: actualFromUserId as Id<"users">,
        toUserId: actualToUserId as Id<"users">,
      });

      toast({
        title: "Settlement Complete",
        description: "The settlement has been marked as complete.",
      });

    } catch (error) {
      console.error("Error settling expense:", error);
      toast({
        title: "Settlement Failed",
        description: "Failed to mark settlement as complete. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSettling(false);
    }
  };

  const handleUnsettlement = async () => {
    setIsUnsettling(true);

    try {
      await markSettlementUnsettled({ month: monthString });

      toast({
        title: "Settlement Removed",
        description: "The settlement has been marked as unsettled.",
      });

    } catch (error) {
      console.error("Error unsettling expense:", error);
      toast({
        title: "Unsettlement Failed",
        description: "Failed to mark settlement as unsettled. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUnsettling(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-20 sm:pb-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold">Settlement</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <MonthNavigator
            currentMonthLabel={currentMonthLabel}
            onNavigateMonth={navigateMonth}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div>Loading...</div>
        </div>
      ) : !monthData ? (
        <div className="flex justify-center p-12 text-red-500">
          Error loading data.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <SettlementCard
              monthData={{
                ...monthData,
                expenses: monthData.expenses.map(e => ({
                  id: e.id,
                  amount: e.amount,
                  date: e.date,
                  category: e.category,
                  location: e.location,
                  description: e.description,
                  paidBy: e.paidBy,
                  split: e.split as "50/50" | "custom" | "100%"
                }))
              }}
              isSettling={isSettling}
              isUnsettling={isUnsettling}
              settlementExists={settlementExists}
              onSettlement={handleSettlement}
              onUnsettlement={handleUnsettlement}
            />

            <PaymentSummaryCards
              user1Paid={monthData.user1Paid}
              user2Paid={monthData.user2Paid}
            />
          </div>

          <SettlementHistory monthString={monthString} />
        </>
      )}
    </div>
  );
};

export default Settlement;

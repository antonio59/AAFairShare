import { useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  getMonthData, 
  getCurrentYear, 
  getCurrentMonth,
  markSettlementComplete,
  markSettlementUnsettled,
  formatMonthString,
  checkSettlementExists,
  getUsers
} from "@/services/expenseService";
import { sendSettlementEmail } from "@/services/api/emailService";

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
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Format the current month for display
  const currentMonthLabel = format(new Date(year, month - 1, 1), "MMMM yyyy");
  const monthString = formatMonthString(year, month);

  // Fetch the month data and settlement status
  const { data: monthData, isLoading, error, refetch } = useQuery({
    queryKey: ["monthData", year, month],
    queryFn: () => getMonthData(year, month),
  });

  // Check if settlement exists
  const { data: settlementExists = false, refetch: refetchSettlementStatus } = useQuery({
    queryKey: ["settlementExists", monthString],
    queryFn: () => checkSettlementExists(monthString),
  });

  // Fetch users
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

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
      // Ensure users array is populated
      if (users.length < 2) {
        toast({
          title: "Error",
          description: "User data not available to complete settlement.",
          variant: "destructive",
        });
        setIsSettling(false);
        return;
      }

      // Determine who is paying whom using actual user UUIDs
      // Adjust logic if users[0] and users[1] mapping to 'User 1'/'User 2' for settlementDirection is different.
      const user1ActualId = users[0].id; // Assumes user object has an 'id' property which is the UUID
      const user2ActualId = users[1].id;

      const actualFromUserId = monthData.settlementDirection === 'owes' ? user1ActualId : user2ActualId;
      const actualToUserId = actualFromUserId === user1ActualId ? user2ActualId : user1ActualId;
      
      await markSettlementComplete(year, month, monthData.settlement, actualFromUserId, actualToUserId);
      
      toast({
        title: "Settlement Complete",
        description: "The settlement has been marked as complete.",
      });
      
      // Send settlement email
      if (users.length >= 2) {
        setIsSendingEmail(true);
        try {
          await sendSettlementEmail(monthData, year, month, users);
          toast({
            title: "Settlement Email Sent",
            description: "A settlement report has been sent to both users.",
          });
        } catch (emailError) {
          console.error("Error sending settlement email:", emailError);
          toast({
            title: "Email Sending Failed",
            description: "Could not send the settlement email. Please try again later.",
            variant: "destructive",
          });
        } finally {
          setIsSendingEmail(false);
        }
      }
      
      // Refresh the data
      refetch();
      refetchSettlementStatus();
      
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
      await markSettlementUnsettled(monthString);
      
      toast({
        title: "Settlement Removed",
        description: "The settlement has been marked as unsettled.",
      });
      
      // Refresh the data
      refetch();
      refetchSettlementStatus();
      
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
    <div className="p-4 sm:p-6">
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
      ) : error ? (
        <div className="flex justify-center p-12 text-red-500">
          Error loading data.
        </div>
      ) : (
        <>
          <SettlementCard 
            monthData={monthData} 
            isSettling={isSettling || isSendingEmail}
            isUnsettling={isUnsettling}
            settlementExists={settlementExists}
            onSettlement={handleSettlement}
            onUnsettlement={handleUnsettlement}
          />

          <PaymentSummaryCards 
            user1Paid={monthData?.user1Paid || 0} 
            user2Paid={monthData?.user2Paid || 0} 
          />

          <SettlementHistory onSettlementUpdated={refetchSettlementStatus} />
        </>
      )}
    </div>
  );
};

export default Settlement;

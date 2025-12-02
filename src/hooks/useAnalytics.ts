import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatMonthString } from "@/services/utils/dateUtils";

type Timeframe = "monthly" | "quarterly" | "yearly";

export const useAnalytics = () => {
  const getCurrentYear = () => new Date().getFullYear();
  const getCurrentMonth = () => new Date().getMonth() + 1;

  const [year, setYear] = useState(getCurrentYear());
  const [month, setMonth] = useState(getCurrentMonth());
  const [timeframe, setTimeframe] = useState<Timeframe>("monthly");

  const monthString = formatMonthString(year, month);
  const monthData = useQuery(api.monthData.getMonthData, { month: monthString });
  const users = useQuery(api.users.getAll);

  const navigateMonth = (direction: "prev" | "next") => {
    let newMonth = month;
    let newYear = year;

    if (direction === "prev") {
      newMonth -= 1;
      if (newMonth === 0) { newMonth = 12; newYear -= 1; }
    } else {
      newMonth += 1;
      if (newMonth === 13) { newMonth = 1; newYear += 1; }
    }

    setMonth(newMonth);
    setYear(newYear);
  };

  const analyticsData = monthData ? {
    totalExpenses: monthData.totalExpenses,
    settlement: monthData.settlement,
    settlementDirection: monthData.settlementDirection,
    spendTrendPercentage: 0,
    spendTrendReason: "Based on current month",
    userComparison: {
      user1Percentage: monthData.totalExpenses > 0 ? (monthData.user1Paid / monthData.totalExpenses) * 100 : 50,
      user2Percentage: monthData.totalExpenses > 0 ? (monthData.user2Paid / monthData.totalExpenses) * 100 : 50,
      user1Total: monthData.user1Paid,
      user2Total: monthData.user2Paid,
    },
    categoryBreakdown: [],
    locationBreakdown: [],
    categoryTrends: [],
    locationTrends: [],
  } : null;

  return {
    year,
    month,
    timeframe,
    setYear,
    setMonth,
    setTimeframe,
    navigateMonth,
    analyticsData,
    users: users ?? [],
    isLoading: monthData === undefined,
    error: null,
    user1Name: users?.[0]?.username || users?.[0]?.name || "User 1",
    user2Name: users?.[1]?.username || users?.[1]?.name || "User 2",
  };
};

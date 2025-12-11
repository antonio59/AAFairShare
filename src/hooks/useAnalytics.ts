import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatMonthString } from "@/services/utils/dateUtils";
import { CategorySummary, LocationSummary } from "@/types";

type Timeframe = "monthly" | "quarterly" | "yearly";

const getPreviousMonth = (year: number, month: number): { year: number; month: number } => {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
};

export const useAnalytics = () => {
  const getCurrentYear = () => new Date().getFullYear();
  const getCurrentMonth = () => new Date().getMonth() + 1;

  const [year, setYear] = useState(getCurrentYear());
  const [month, setMonth] = useState(getCurrentMonth());
  const [timeframe, setTimeframe] = useState<Timeframe>("monthly");

  const monthString = formatMonthString(year, month);
  const prevMonth = getPreviousMonth(year, month);
  const prevMonthString = formatMonthString(prevMonth.year, prevMonth.month);
  
  const monthData = useQuery(api.monthData.getMonthData, { month: monthString });
  const prevMonthData = useQuery(api.monthData.getMonthData, { month: prevMonthString });
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

  const { categoryBreakdown, locationBreakdown } = useMemo(() => {
    const expenses = monthData?.expenses;
    const totalExpenses = monthData?.totalExpenses ?? 0;
    
    if (!expenses || expenses.length === 0) {
      return { categoryBreakdown: [], locationBreakdown: [] };
    }

    const categoryMap = new Map<string, number>();
    const locationMap = new Map<string, number>();

    expenses.forEach((expense) => {
      const categoryName = expense.category || "Uncategorized";
      const locationName = expense.location || "Unknown";
      
      categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + expense.amount);
      locationMap.set(locationName, (locationMap.get(locationName) || 0) + expense.amount);
    });

    const categoryBreakdown: CategorySummary[] = Array.from(categoryMap.entries())
      .map(([name, total]) => ({
        name,
        total: parseFloat(total.toFixed(2)),
        percentage: totalExpenses > 0 ? parseFloat(((total / totalExpenses) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const locationBreakdown: LocationSummary[] = Array.from(locationMap.entries())
      .map(([name, total]) => ({
        name,
        total: parseFloat(total.toFixed(2)),
        percentage: totalExpenses > 0 ? parseFloat(((total / totalExpenses) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return { categoryBreakdown, locationBreakdown };
  }, [monthData]);

  const currentTotal = monthData?.totalExpenses ?? 0;
  const lastTotal = prevMonthData?.totalExpenses ?? 0;

  const { spendTrendPercentage, spendTrendReason } = useMemo(() => {
    if (currentTotal === 0 && lastTotal === 0) {
      return { spendTrendPercentage: 0, spendTrendReason: "no_spending_both" };
    }

    if (lastTotal === 0 && currentTotal > 0) {
      return { spendTrendPercentage: 100, spendTrendReason: "new_spending" };
    }

    if (lastTotal > 0 && currentTotal === 0) {
      return { spendTrendPercentage: -100, spendTrendReason: "no_spending_current" };
    }

    const change = ((currentTotal - lastTotal) / lastTotal) * 100;
    let reason = "unchanged";
    if (change > 0) {
      reason = "increased";
    } else if (change < 0) {
      reason = "decreased";
    }

    return { 
      spendTrendPercentage: parseFloat(change.toFixed(1)), 
      spendTrendReason: reason 
    };
  }, [currentTotal, lastTotal]);

  const analyticsData = monthData ? {
    totalExpenses: monthData.totalExpenses,
    settlement: monthData.settlement,
    settlementDirection: monthData.settlementDirection,
    sharedExpensesTotal: monthData.sharedExpensesTotal ?? monthData.totalExpenses,
    eachPersonsShare: monthData.eachPersonsShare ?? monthData.totalExpenses / 2,
    spendTrendPercentage,
    spendTrendReason,
    previousMonthTotal: prevMonthData?.totalExpenses ?? 0,
    userComparison: {
      user1Percentage: monthData.totalExpenses > 0 ? parseFloat(((monthData.user1Paid / monthData.totalExpenses) * 100).toFixed(1)) : 0,
      user2Percentage: monthData.totalExpenses > 0 ? parseFloat(((monthData.user2Paid / monthData.totalExpenses) * 100).toFixed(1)) : 0,
      user1Total: monthData.user1Paid,
      user2Total: monthData.user2Paid,
    },
    categoryBreakdown,
    locationBreakdown,
    categoryTrends: categoryBreakdown.slice(0, 5),
    locationTrends: locationBreakdown.slice(0, 5),
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
    isAnalyticsLoading: monthData === undefined,
    analyticsError: null,
    user1Name: users?.[0]?.username || users?.[0]?.name || "User 1",
    user2Name: users?.[1]?.username || users?.[1]?.name || "User 2",
  };
};

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAnalyticsData } from "@/services/api/analyticsService";
import { getUsers } from "@/services/api/userService";
import { AnalyticsData, User } from "@/types";

type Timeframe = "monthly" | "quarterly" | "yearly";

export const useAnalytics = () => {
  const getCurrentYear = () => new Date().getFullYear();
  const getCurrentMonth = () => new Date().getMonth() + 1;

  const [year, setYear] = useState(getCurrentYear());
  const [month, setMonth] = useState(getCurrentMonth());
  const [timeframe, setTimeframe] = useState<Timeframe>("monthly");

  const {
    data: analyticsData,
    isLoading: isAnalyticsLoading,
    error: analyticsError,
  } = useQuery<AnalyticsData>({
    queryKey: ["analytics", year, month, timeframe],
    queryFn: () => getAnalyticsData(year, month, timeframe),
  });

  const { data: users = [] } = useQuery<User[]>({
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

  return {
    year,
    month,
    timeframe,
    analyticsData,
    isAnalyticsLoading,
    analyticsError,
    users,
    navigateMonth,
    setTimeframe,
  };
};
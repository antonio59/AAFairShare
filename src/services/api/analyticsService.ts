import { getSupabase } from "@/integrations/supabase/client";
import { AnalyticsData } from "@/types";

export const getAnalyticsData = async (year: number, month: number, timeframe: "monthly" | "quarterly" | "yearly"): Promise<AnalyticsData> => {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc('get_analytics_data', {
    p_year: year,
    p_month: month,
    p_timeframe: timeframe,
  });

  if (error) {
    console.error("Error fetching analytics data:", error);
    throw error;
  }

  return data;
};
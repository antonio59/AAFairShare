import { getSupabase } from "@/integrations/supabase/client";
import { AnalyticsData } from "@/types";
import { format } from "date-fns";

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

interface SpendingResult {
  total: number;
  count: number;
  average: number;
  periodTotal?: number;
  periodCount?: number;
}

export const getLocationSpending = async (locationName: string, startDate: Date | null = null): Promise<SpendingResult> => {
  try {
    const supabase = await getSupabase();
    
    // Get location ID
    const { data: locationData, error: locationError } = await supabase
      .from('locations')
      .select('id')
      .ilike('name', locationName)
      .single();
    
    if (locationError || !locationData) {
      return { total: 0, count: 0, average: 0 };
    }
    
    // Build query
    let query = supabase
      .from('expenses')
      .select('amount')
      .eq('location_id', locationData.id);
    
    if (startDate) {
      query = query.gte('date', format(startDate, 'yyyy-MM-dd'));
    }
    
    const { data: expenses, error } = await query;
    
    if (error) throw error;
    
    const total = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
    const count = expenses?.length || 0;
    const average = count > 0 ? total / count : 0;
    
    // Get total for period to calculate percentage
    let periodQuery = supabase.from('expenses').select('amount');
    if (startDate) {
      periodQuery = periodQuery.gte('date', format(startDate, 'yyyy-MM-dd'));
    }
    const { data: periodExpenses } = await periodQuery;
    const periodTotal = periodExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
    
    return {
      total,
      count,
      average,
      periodTotal,
      periodCount: periodExpenses?.length || 0
    };
  } catch (error) {
    console.error("Error fetching location spending:", error);
    throw error;
  }
};

export const getCategorySpending = async (categoryName: string, startDate: Date | null = null): Promise<SpendingResult> => {
  try {
    const supabase = await getSupabase();
    
    // Get category ID
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', categoryName)
      .single();
    
    if (categoryError || !categoryData) {
      return { total: 0, count: 0, average: 0 };
    }
    
    // Build query
    let query = supabase
      .from('expenses')
      .select('amount')
      .eq('category_id', categoryData.id);
    
    if (startDate) {
      query = query.gte('date', format(startDate, 'yyyy-MM-dd'));
    }
    
    const { data: expenses, error } = await query;
    
    if (error) throw error;
    
    const total = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
    const count = expenses?.length || 0;
    const average = count > 0 ? total / count : 0;
    
    // Get total for period to calculate percentage
    let periodQuery = supabase.from('expenses').select('amount');
    if (startDate) {
      periodQuery = periodQuery.gte('date', format(startDate, 'yyyy-MM-dd'));
    }
    const { data: periodExpenses } = await periodQuery;
    const periodTotal = periodExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
    
    return {
      total,
      count,
      average,
      periodTotal,
      periodCount: periodExpenses?.length || 0
    };
  } catch (error) {
    console.error("Error fetching category spending:", error);
    throw error;
  }
};
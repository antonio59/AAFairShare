import { getPocketBase } from "@/integrations/pocketbase/client";
import { AnalyticsData } from "@/types";
import { format } from "date-fns";

export const getAnalyticsData = async (year: number, month: number, timeframe: "monthly" | "quarterly" | "yearly"): Promise<AnalyticsData> => {
  const pb = await getPocketBase();
  const startMonth = `${year}-${String(month).padStart(2,'0')}`
  let startDate = new Date(`${startMonth}-01`)
  let endDate = new Date(startDate)
  if (timeframe === 'monthly') {
    endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + 1)
  } else if (timeframe === 'quarterly') {
    endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + 3)
  } else {
    endDate = new Date(`${year + 1}-01-01`)
  }
  const startStr = format(startDate, 'yyyy-MM-dd')
  const endStr = format(endDate, 'yyyy-MM-dd')
  const list = await pb.collection('expenses').getFullList({
    filter: `date >= "${startStr}" && date < "${endStr}"`,
    fields: 'amount,category_id,location_id,paid_by_id'
  })
  const total = list.reduce((s:any,e:any)=>s + (e.amount || 0), 0)
  return {
    total_spending: total,
    monthly_average: total, // simplified
    category_totals: {},
    location_totals: {},
    top_spenders: [],
  } as unknown as AnalyticsData
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
    const pb = await getPocketBase();
    let location: any | null = null
    try {
      location = await pb.collection('locations').getFirstListItem(`name ~ "${locationName}"`, { fields: 'id' })
    } catch (_) {
      location = null
    }
    if (!location?.id) return { total: 0, count: 0, average: 0 }

    const filterParts = [`location_id = "${location.id}"`]
    if (startDate) filterParts.push(`date >= "${format(startDate, 'yyyy-MM-dd')}"`)
    const expensesList = await pb.collection('expenses').getFullList({
      filter: filterParts.join(' && '),
      fields: 'amount'
    })
    const total = expensesList?.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0) || 0
    const count = expensesList?.length || 0
    const average = count > 0 ? total / count : 0;
    
    // Get total for period to calculate percentage
    const periodFilter = startDate ? `date >= "${format(startDate, 'yyyy-MM-dd')}"` : ''
    const periodExpenses = await pb.collection('expenses').getFullList({
      filter: periodFilter,
      fields: 'amount'
    })
    const periodTotal = periodExpenses?.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0) || 0
    
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
    const pb = await getPocketBase();
    let category: any | null = null
    try {
      category = await pb.collection('categories').getFirstListItem(`name ~ "${categoryName}"`, { fields: 'id' })
    } catch (_) {
      category = null
    }
    if (!category?.id) return { total: 0, count: 0, average: 0 }

    const filterParts = [`category_id = "${category.id}"`]
    if (startDate) filterParts.push(`date >= "${format(startDate, 'yyyy-MM-dd')}"`)
    const expensesList = await pb.collection('expenses').getFullList({
      filter: filterParts.join(' && '),
      fields: 'amount'
    })
    const total = expensesList?.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0) || 0
    const count = expensesList?.length || 0
    const average = count > 0 ? total / count : 0;
    
    // Get total for period to calculate percentage
    const periodFilter = startDate ? `date >= "${format(startDate, 'yyyy-MM-dd')}"` : ''
    const periodExpenses = await pb.collection('expenses').getFullList({
      filter: periodFilter,
      fields: 'amount'
    })
    const periodTotal = periodExpenses?.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0) || 0
    
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

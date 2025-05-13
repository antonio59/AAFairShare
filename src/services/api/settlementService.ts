import { getSupabase } from "@/integrations/supabase/client";
import { formatMonthString } from "../utils/dateUtils";
import { format } from "date-fns";

// Mark settlement as completed
export const markSettlementComplete = async (year: number, month: number, amount: number, fromUserId: string, toUserId: string): Promise<void> => {
  try {
    const supabase = await getSupabase();
    const monthString = formatMonthString(year, month);
    const currentDate = format(new Date(), 'yyyy-MM-dd');
    
    // Insert a new settlement record
    const { error } = await supabase
      .from('settlements')
      .insert({
        month: monthString,
        date: currentDate,
        amount: parseFloat(amount.toFixed(2)), // Round to 2 decimal places
        from_user_id: fromUserId,
        to_user_id: toUserId,
        status: 'completed',
        recorded_by: fromUserId // Assuming the person who owes is marking it as settled
      });
    
    if (error) throw error;
    
  } catch (error) {
    console.error("Error marking settlement as completed:", error);
    throw error;
  }
};

// Mark settlement as unsettled (delete the settlement record)
export const markSettlementUnsettled = async (month: string): Promise<void> => {
  try {
    const supabase = await getSupabase();
    // Delete the settlement record for the specified month
    const { error } = await supabase
      .from('settlements')
      .delete()
      .eq('month', month);
    
    if (error) throw error;
    
  } catch (error) {
    console.error("Error marking settlement as unsettled:", error);
    throw error;
  }
};

// Check if a settlement exists for a given month
export const checkSettlementExists = async (month: string): Promise<boolean> => {
  try {
    const supabase = await getSupabase();
    // Using .limit(1) instead of .single() for diagnostics
    const { data, error, count } = await supabase
      .from('settlements')
      .select('id', { count: 'exact' }) // Request count for better diagnostics
      .eq('month', month)
      .limit(1);
    
    if (error) {
      // Log the full error details if one occurs with this modified query
      console.error(`Error checking settlement existence with limit(1) for month ${month}:`, JSON.stringify(error, null, 2));
      throw error; // Re-throw to be caught by react-query
    }
    
    // If data is an array and not empty, or if count > 0, a settlement exists.
    // Supabase typically returns an array for data when not using .single() or .maybeSingle()
    // console.log(`Settlement check for ${month}: data = ${JSON.stringify(data)}, count = ${count}`);
    return (data && data.length > 0) || (count !== null && count > 0);

  } catch (error) {
    // This catch block might now see the raw error if thrown from above
    // The react-query layer will also handle this thrown error.
    console.error(`Outer catch in checkSettlementExists for month ${month}:`, error);
    throw error; // Ensure error propagates
  }
};

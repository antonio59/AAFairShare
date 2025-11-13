import { getPocketBase } from "@/integrations/pocketbase/client";
import { formatMonthString } from "../utils/dateUtils";
import { format } from "date-fns";

// Mark settlement as completed
export const markSettlementComplete = async (year: number, month: number, amount: number, fromUserId: string, toUserId: string): Promise<void> => {
  try {
    const pb = await getPocketBase();
    const monthString = formatMonthString(year, month);
    const currentDate = format(new Date(), 'yyyy-MM-dd');
    
    await pb.collection('settlements').create({
      month: monthString,
      date: currentDate,
      amount: parseFloat(amount.toFixed(2)),
      from_user_id: fromUserId,
      to_user_id: toUserId,
      status: 'completed',
      recorded_by: fromUserId,
    })
    
  } catch (error) {
    console.error("Error marking settlement as completed:", error);
    throw error;
  }
};

// Mark settlement as unsettled (delete the settlement record)
export const markSettlementUnsettled = async (month: string): Promise<void> => {
  try {
    const pb = await getPocketBase();
    const list = await pb.collection('settlements').getFullList({
      filter: `month = "${month}"`,
      fields: 'id'
    })
    await Promise.all(list.map((r:any) => pb.collection('settlements').delete(r.id)))
    
  } catch (error) {
    console.error("Error marking settlement as unsettled:", error);
    throw error;
  }
};

// Check if a settlement exists for a given month
export const checkSettlementExists = async (month: string): Promise<boolean> => {
  try {
    const pb = await getPocketBase();
    const list = await pb.collection('settlements').getList(1, 1, {
      filter: `month = "${month}"`,
      fields: 'id'
    })
    return list.totalItems > 0;

  } catch (error) {
    console.error(`Outer catch in checkSettlementExists for month ${month}:`, error);
    throw error; // Ensure error propagates
  }
};

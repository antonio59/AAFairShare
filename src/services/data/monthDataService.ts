import { Expense, MonthData } from "@/types";
import { formatMonthString } from "../utils/dateUtils";
import { getSupabase } from "@/integrations/supabase/client";
import { getUsers } from "../api/userService";

// Get expenses and summary for a specific month
export const getMonthData = async (year: number, month: number): Promise<MonthData> => {
  try {
    const supabase = await getSupabase();
    // Get expenses for the specified month
    const monthString = formatMonthString(year, month);
    console.log(`Fetching expenses for month: ${monthString}`);
    
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select(`
        id, 
        amount, 
        date,
        description,
        split_type,
        paid_by_id,
        category_id (id, name),
        location_id (id, name)
      `)
      .eq('month', monthString)
      .order('date', { ascending: false });
      
    if (expensesError) {
      console.error("Error fetching expenses:", expensesError);
      throw expensesError;
    }

    console.log(`Found ${expenses.length} expenses for month ${monthString}`);

    // Get users for attribution
    const users = await getUsers();
    
    // Map the data to match our Expense type
    const mappedExpenses: Expense[] = expenses.map(exp => ({
      id: exp.id,
      amount: Number(exp.amount),
      date: exp.date,
      category: exp.category_id?.name || "Uncategorized",
      location: exp.location_id?.name || "Unknown",
      description: exp.description || "",
      paidBy: exp.paid_by_id || "",
      split: exp.split_type || "50/50"
    }));

    // Calculate totals
    const totalExpenses = parseFloat(mappedExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2));

    // Parse each expense to determine the share owed by each user
    const user1 = users && users[0] ? users[0].id : "";
    const user2 = users && users[1] ? users[1].id : "";
    
    let user1Paid = 0;
    let user2Paid = 0;
    let user1Share = 0;
    let user2Share = 0;
    
    mappedExpenses.forEach(expense => {
      // Track what each user paid
      if (expense.paidBy === user1) {
        user1Paid += expense.amount;
      } else if (expense.paidBy === user2) {
        user2Paid += expense.amount;
      }
      
      // Calculate fair share based on split type
      if (expense.split === "50/50") {
        // Split equally
        user1Share += expense.amount / 2;
        user2Share += expense.amount / 2;
      } else if (expense.split === "custom" || expense.split === "100%") {
        // "Other pays full" - the other person owes the full amount
        if (expense.paidBy === user1) {
          // User 1 paid, so User 2 owes the full amount
          user2Share += expense.amount;
        } else if (expense.paidBy === user2) {
          // User 2 paid, so User 1 owes the full amount
          user1Share += expense.amount;
        }
      }
    });
    
    // Round to ensure precise decimal values
    user1Paid = parseFloat(user1Paid.toFixed(2));
    user2Paid = parseFloat(user2Paid.toFixed(2));
    user1Share = parseFloat(user1Share.toFixed(2));
    user2Share = parseFloat(user2Share.toFixed(2));
    
    // Calculate settlement
    const user1Owes = parseFloat((user1Share - user1Paid).toFixed(2));
    const settlement = parseFloat(Math.abs(user1Owes).toFixed(2));
    let settlementDirection: 'owes' | 'owed' | 'even' = 'even';
    
    if (user1Owes > 0) {
      settlementDirection = 'owes'; // User 1 owes User 2
    } else if (user1Owes < 0) {
      settlementDirection = 'owed'; // User 2 owes User 1
    }

    return {
      totalExpenses,
      fairShare: parseFloat((totalExpenses / 2).toFixed(2)), // Round fair share
      settlement,
      settlementDirection,
      user1Paid,
      user2Paid,
      expenses: mappedExpenses
    };
  } catch (error) {
    console.error("Error getting month data:", error);
    throw error;
  }
};

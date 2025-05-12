import { RecurringExpense } from "@/types";
import { getSupabase } from "@/integrations/supabase/client";
import { format, parseISO, addWeeks, addMonths, addYears } from "date-fns";
import { formatMonthString } from "../utils/dateUtils";

// Get recurring expenses
export const getRecurringExpenses = async (): Promise<RecurringExpense[]> => {
  try {
    const supabase = await getSupabase();
    const { data: recurringData, error } = await supabase
      .from('recurring')
      .select(`
        id,
        amount,
        next_due_date,
        frequency,
        description,
        user_id,
        category_id (id, name),
        location_id (id, name),
        split_type
      `)
      .order('next_due_date', { ascending: true });
    
    if (error) throw error;
    
    return recurringData.map(item => ({
      id: item.id,
      amount: item.amount,
      nextDueDate: item.next_due_date,
      frequency: item.frequency,
      description: item.description,
      userId: item.user_id,
      category: item.category_id?.name || '',
      location: item.location_id?.name || '',
      split: item.split_type || '50/50'
    }));
  } catch (error) {
    console.error("Error fetching recurring expenses:", error);
    throw error;
  }
};

// Add recurring expense
export const addRecurringExpense = async (recurring: {
  amount: number;
  next_due_date: string;
  category: string;
  location: string;
  description?: string;
  user_id: string;
  frequency: string;
  split_type?: string;
  end_date?: string | null; // Add optional end_date
}): Promise<void> => {
  try {
    const supabase = await getSupabase();

    // First, we need to look up or create category and location
    let categoryId;
    let locationId;
    
    // Look up or create category
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('name', recurring.category)
      .single();
      
    if (existingCategory) {
      categoryId = (existingCategory as { id: string }).id;
    } else {
      const { data: newCategory } = await supabase
        .from('categories')
        .insert({ name: recurring.category })
        .select('id')
        .single();
      categoryId = (newCategory as { id: string }).id;
    }
    
    // Look up or create location
    const { data: existingLocation } = await supabase
      .from('locations')
      .select('id')
      .eq('name', recurring.location)
      .single();
      
    if (existingLocation) {
      locationId = (existingLocation as { id: string }).id;
    } else {
      const { data: newLocation } = await supabase
        .from('locations')
        .insert({ name: recurring.location })
        .select('id')
        .single();
      locationId = (newLocation as { id: string }).id;
    }
    
    // Insert the recurring expense
    const { error } = await supabase
      .from('recurring')
      .insert({
        amount: recurring.amount,
        next_due_date: recurring.next_due_date,
        frequency: recurring.frequency,
        description: recurring.description,
        user_id: recurring.user_id,
        category_id: categoryId,
        location_id: locationId,
        split_type: recurring.split_type || '50/50', // Default to 50/50 if not provided
        end_date: recurring.end_date, // Add end_date to insert
      });
    
    if (error) throw error;
    
  } catch (error) {
    console.error("Error adding recurring expense:", error);
    throw error;
  }
};

// Update recurring expense
export const updateRecurringExpense = async (recurring: {
  id: string;
  amount?: number;
  next_due_date?: string;
  category?: string;
  location?: string;
  description?: string;
  frequency?: string;
  user_id?: string;
  split_type?: string;
}): Promise<void> => {
  try {
    const supabase = await getSupabase();
    
    // Prepare update data
    interface RecurringExpenseUpdateData {
      amount?: number;
      next_due_date?: string;
      description?: string | null;
      category_id?: string;
      location_id?: string;
      user_id?: string;
      frequency?: string;
      split_type?: string | null;
      updated_at?: string;
    }
    const updateData: RecurringExpenseUpdateData = {};
    
    if (recurring.amount !== undefined) {
      updateData.amount = recurring.amount;
    }
    
    if (recurring.next_due_date) {
      updateData.next_due_date = recurring.next_due_date;
    }
    
    if (recurring.description !== undefined) {
      updateData.description = recurring.description;
    }
    
    if (recurring.frequency) {
      updateData.frequency = recurring.frequency;
    }
    
    if (recurring.user_id) {
      updateData.user_id = recurring.user_id;
    }
    
    if (recurring.split_type) {
      updateData.split_type = recurring.split_type;
    }
    
    // Handle category update
    if (recurring.category) {
      // Look up or create category
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('name', recurring.category)
        .single();
        
      if (existingCategory) {
        updateData.category_id = (existingCategory as { id: string }).id;
      } else {
        const { data: newCategory } = await supabase
          .from('categories')
          .insert({ name: recurring.category })
          .select('id')
          .single();
        updateData.category_id = (newCategory as { id: string }).id;
      }
    }
    
    // Handle location update
    if (recurring.location) {
      // Look up or create location
      const { data: existingLocation } = await supabase
        .from('locations')
        .select('id')
        .eq('name', recurring.location)
        .single();
        
      if (existingLocation) {
        updateData.location_id = (existingLocation as { id: string }).id;
      } else {
        const { data: newLocation } = await supabase
          .from('locations')
          .insert({ name: recurring.location })
          .select('id')
          .single();
        updateData.location_id = (newLocation as { id: string }).id;
      }
    }
    
    // Update the recurring expense
    const { error } = await supabase
      .from('recurring')
      .update(updateData)
      .eq('id', recurring.id);
    
    if (error) throw error;
    
  } catch (error) {
    console.error("Error updating recurring expense:", error);
    throw error;
  }
};

// Delete recurring expense
export const deleteRecurringExpense = async (id: string): Promise<void> => {
  try {
    const supabase = await getSupabase();
    
    const { error } = await supabase
      .from('recurring')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
  } catch (error) {
    console.error("Error deleting recurring expense:", error);
    throw error;
  }
};

// Generate expense from recurring expense
export const generateExpenseFromRecurring = async (recurringId: string): Promise<void> => {
  try {
    const supabase = await getSupabase();
    
    // Get the recurring expense
    const { data: recurring, error: fetchError } = await supabase
      .from('recurring')
      .select(`
        id,
        amount,
        next_due_date,
        frequency,
        description,
        user_id,
        category_id,
        location_id,
        split_type
      `)
      .eq('id', recurringId)
      .single();
    
    if (fetchError) throw fetchError;
    if (!recurring) throw new Error("Recurring expense not found");
    
    // Create an expense from the recurring expense
    const expenseDate = recurring.next_due_date;
    const monthString = format(parseISO(expenseDate), 'yyyy-MM');

    // Insert the expense
    const { error: insertError } = await supabase
      .from('expenses')
      .insert({
        amount: recurring.amount,
        date: expenseDate,
        month: monthString,
        description: recurring.description,
        paid_by_id: recurring.user_id,
        category_id: recurring.category_id,
        location_id: recurring.location_id,
        split_type: recurring.split_type || '50/50' // Use the split type from recurring expense or default to 50/50
      });

    if (insertError) throw insertError;
    
    // Update next due date based on frequency
    const currentDate = parseISO(recurring.next_due_date);
    let nextDueDate;
    
    switch (recurring.frequency) {
      case 'weekly':
        nextDueDate = addWeeks(currentDate, 1);
        break;
      case 'monthly':
        nextDueDate = addMonths(currentDate, 1);
        break;
      case 'yearly':
        nextDueDate = addYears(currentDate, 1);
        break;
      default:
        nextDueDate = addMonths(currentDate, 1); // Default to monthly
    }
    
    // Update the recurring expense with the new next_due_date
    const { error: updateError } = await supabase
      .from('recurring')
      .update({
        next_due_date: format(nextDueDate, 'yyyy-MM-dd')
      })
      .eq('id', recurringId);
    
    if (updateError) throw updateError;
    
  } catch (error) {
    console.error("Error generating expense from recurring:", error);
    throw error;
  }
};

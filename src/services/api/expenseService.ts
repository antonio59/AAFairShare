import { Expense } from "@/types";
import { getSupabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";

// Add new expense
export const addExpense = async (expense: Omit<Expense, "id">): Promise<Expense> => {
  try {
    const supabase = await getSupabase();
    
    // First, we need to look up or create category and location
    let categoryId;
    let locationId;
    
    // Look up or create category
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('name', expense.category)
      .single();
      
    if (existingCategory) {
      categoryId = existingCategory.id;
    } else {
      const { data: newCategory } = await supabase
        .from('categories')
        .insert({ name: expense.category })
        .select('id')
        .single();
      categoryId = newCategory?.id;
    }
    
    // Look up or create location
    const { data: existingLocation } = await supabase
      .from('locations')
      .select('id')
      .eq('name', expense.location)
      .single();
      
    if (existingLocation) {
      locationId = (existingLocation as { id: string }).id;
    } else {
      const { data: newLocation } = await supabase
        .from('locations')
        .insert({ name: expense.location })
        .select('id')
        .single();
      locationId = newLocation?.id;
    }

    // Determine month string (YYYY-MM)
    const expenseDate = parseISO(expense.date);
    const monthString = format(expenseDate, 'yyyy-MM');
    
    // Normalize split type to "custom" for backend storage
    const normalizedSplitType = expense.split === "100%" ? "custom" : expense.split;
    
    // Insert the expense
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        amount: expense.amount,
        date: expense.date,
        month: monthString,
        description: expense.description,
        paid_by_id: expense.paidBy,
        category_id: categoryId,
        location_id: locationId,
        split_type: normalizedSplitType
      })
      .select('id')
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      ...expense
    };
  } catch (error) {
    console.error("Error adding expense:", error);
    throw error;
  }
};

// Update existing expense
export const updateExpense = async (id: string, expense: Partial<Omit<Expense, "id">>): Promise<void> => {
  try {
    const supabase = await getSupabase();
    
    // Prepare update data
    interface ExpenseUpdateData {
      amount?: number;
      date?: string;
      month?: string;
      description?: string | null;
      paid_by_id?: string;
      category_id?: string;
      location_id?: string;
      split_type?: string | null;
      updated_at?: string;
    }
    const updateData: ExpenseUpdateData = {};
    
    if (expense.amount !== undefined) {
      updateData.amount = expense.amount;
    }
    
    if (expense.date) {
      updateData.date = expense.date;
      // Update month string if date changes
      const expenseDate = parseISO(expense.date);
      updateData.month = format(expenseDate, 'yyyy-MM');
    }
    
    if (expense.description !== undefined) {
      updateData.description = expense.description;
    }
    
    if (expense.paidBy) {
      updateData.paid_by_id = expense.paidBy;
    }
    
    if (expense.split) {
      // Normalize split type for database storage
      updateData.split_type = expense.split === "100%" ? "custom" : expense.split;
    }
    
    // Handle category update
    if (expense.category) {
      // Look up or create category
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('name', expense.category)
        .single();
        
      if (existingCategory) {
        updateData.category_id = existingCategory.id;
      } else {
        const { data: newCategory } = await supabase
          .from('categories')
          .insert({ name: expense.category })
          .select('id')
          .single();
        updateData.category_id = newCategory?.id;
      }
    }
    
    // Handle location update
    if (expense.location) {
      // Look up or create location
      const { data: existingLocation } = await supabase
        .from('locations')
        .select('id')
        .eq('name', expense.location)
        .single();
        
      if (existingLocation) {
        updateData.location_id = (existingLocation as { id: string }).id;
      } else {
        const { data: newLocation } = await supabase
          .from('locations')
          .insert({ name: expense.location })
          .select('id')
          .single();
        updateData.location_id = newLocation?.id;
      }
    }
    
    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();
    
    // Update the expense
    const { error } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', id);
    
    if (error) throw error;
    
  } catch (error) {
    console.error("Error updating expense:", error);
    throw error;
  }
};

// Delete expense
export const deleteExpense = async (id: string): Promise<void> => {
  try {
    const supabase = await getSupabase();
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
};

import { Expense } from "@/types";
import { getPocketBase } from "@/integrations/pocketbase/client";
import { format, parseISO } from "date-fns";

// Add new expense
export const addExpense = async (expense: Omit<Expense, "id">): Promise<Expense> => {
  try {
    const pb = await getPocketBase();
    
    // First, we need to look up or create category and location
    let categoryId;
    let locationId;
    
    // Look up or create category
    let existingCategory: any | null = null
    try {
      existingCategory = await pb.collection('categories').getFirstListItem(`name="${expense.category}"`, { fields: 'id' })
    } catch (_) {
      existingCategory = null
    }
      
    if (existingCategory) {
      categoryId = existingCategory.id;
    } else {
      const newCategory = await pb.collection('categories').create({ name: expense.category })
      categoryId = newCategory?.id;
    }
    
    // Look up or create location
    let existingLocation: any | null = null
    try {
      existingLocation = await pb.collection('locations').getFirstListItem(`name="${expense.location}"`, { fields: 'id' })
    } catch (_) {
      existingLocation = null
    }
      
    if (existingLocation) {
      locationId = (existingLocation as { id: string }).id;
    } else {
      const newLocation = await pb.collection('locations').create({ name: expense.location })
      locationId = newLocation?.id;
    }

    // Determine month string (YYYY-MM)
    const expenseDate = parseISO(expense.date);
    const monthString = format(expenseDate, 'yyyy-MM');
    
    // Normalize split type to "custom" for backend storage
    const normalizedSplitType = expense.split === "100%" ? "custom" : expense.split;
    
    // Insert the expense
    const data = await pb.collection('expenses').create({
      amount: expense.amount,
      date: expense.date,
      month: monthString,
      description: expense.description,
      paid_by_id: expense.paidBy,
      category_id: categoryId,
      location_id: locationId,
      split_type: normalizedSplitType
    })
    
    // Verify the expense was actually inserted by checking the returned data
    if (!data || !data.id) {
      throw new Error("Expense was not properly saved to database");
    }
    
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
    const pb = await getPocketBase();
    
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
      let existingCategory: any | null = null
      try {
        existingCategory = await pb.collection('categories').getFirstListItem(`name="${expense.category}"`, { fields: 'id' })
      } catch (_) {
        existingCategory = null
      }
        
      if (existingCategory) {
        updateData.category_id = existingCategory.id;
      } else {
        const newCategory = await pb.collection('categories').create({ name: expense.category })
        updateData.category_id = newCategory?.id;
      }
    }
    
    // Handle location update
    if (expense.location) {
      // Look up or create location
      let existingLocation: any | null = null
      try {
        existingLocation = await pb.collection('locations').getFirstListItem(`name="${expense.location}"`, { fields: 'id' })
      } catch (_) {
        existingLocation = null
      }
        
      if (existingLocation) {
        updateData.location_id = (existingLocation as { id: string }).id;
      } else {
        const newLocation = await pb.collection('locations').create({ name: expense.location })
        updateData.location_id = newLocation?.id;
      }
    }
    
    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();
    
    // Update the expense
    await pb.collection('expenses').update(id, updateData)
    
  } catch (error) {
    console.error("Error updating expense:", error);
    throw error;
  }
};

// Delete expense
export const deleteExpense = async (id: string): Promise<void> => {
  try {
    const pb = await getPocketBase();
    await pb.collection('expenses').delete(id)
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
};

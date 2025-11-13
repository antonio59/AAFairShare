import { RecurringExpense } from "@/types";
import { getPocketBase } from "@/integrations/pocketbase/client";
import { format, parseISO, addWeeks, addMonths, addYears } from "date-fns";
import { formatMonthString } from "../utils/dateUtils";

// Get recurring expenses
export const getRecurringExpenses = async (): Promise<RecurringExpense[]> => {
  try {
    const pb = await getPocketBase();
    const list = await pb.collection('recurring').getFullList({
      sort: 'next_due_date',
      expand: 'category_id,location_id',
      fields: 'id,amount,next_due_date,end_date,frequency,description,user_id,category_id,location_id,split_type,created_at,expand.category_id.name,expand.location_id.name'
    })

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return list.map((item: any) => {
      const endDate = item.end_date ? parseISO(item.end_date) : null
      const status = endDate && endDate < today ? 'ended' : 'active'
      return {
        id: item.id,
        amount: item.amount,
        nextDueDate: item.next_due_date,
        endDate: item.end_date,
        frequency: item.frequency,
        description: item.description,
        userId: item.user_id,
        category: item?.expand?.category_id?.name || '',
        location: item?.expand?.location_id?.name || '',
        split: item.split_type || '50/50',
        status: status as 'active' | 'ended',
        createdAt: item.created_at
      } as RecurringExpense
    })
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
    const pb = await getPocketBase();

    // First, we need to look up or create category and location
    let categoryId;
    let locationId;
    
    // Look up or create category
    let existingCategory: any | null = null
    try {
      existingCategory = await pb.collection('categories').getFirstListItem(`name="${recurring.category}"`, { fields: 'id' })
    } catch (_) {
      existingCategory = null
    }
      
    if (existingCategory) {
      categoryId = (existingCategory as { id: string }).id;
    } else {
      const newCategory = await pb.collection('categories').create({ name: recurring.category })
      categoryId = newCategory.id;
    }
    
    // Look up or create location
    let existingLocation: any | null = null
    try {
      existingLocation = await pb.collection('locations').getFirstListItem(`name="${recurring.location}"`, { fields: 'id' })
    } catch (_) {
      existingLocation = null
    }
      
    if (existingLocation) {
      locationId = (existingLocation as { id: string }).id;
    } else {
      const newLocation = await pb.collection('locations').create({ name: recurring.location })
      locationId = newLocation.id;
    }
    
    // Insert the recurring expense
    await pb.collection('recurring').create({
      amount: recurring.amount,
      next_due_date: recurring.next_due_date,
      frequency: recurring.frequency,
      description: recurring.description,
      user_id: recurring.user_id,
      category_id: categoryId,
      location_id: locationId,
      split_type: recurring.split_type || '50/50',
      end_date: recurring.end_date,
    })
    
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
    const pb = await getPocketBase();
    
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
      let existingCategory: any | null = null
      try {
        existingCategory = await pb.collection('categories').getFirstListItem(`name="${recurring.category}"`, { fields: 'id' })
      } catch (_) {
        existingCategory = null
      }
        
      if (existingCategory) {
        updateData.category_id = (existingCategory as { id: string }).id;
      } else {
        const newCategory = await pb.collection('categories').create({ name: recurring.category })
        updateData.category_id = newCategory.id;
      }
    }
    
    // Handle location update
    if (recurring.location) {
      // Look up or create location
      let existingLocation: any | null = null
      try {
        existingLocation = await pb.collection('locations').getFirstListItem(`name="${recurring.location}"`, { fields: 'id' })
      } catch (_) {
        existingLocation = null
      }
        
      if (existingLocation) {
        updateData.location_id = (existingLocation as { id: string }).id;
      } else {
        const newLocation = await pb.collection('locations').create({ name: recurring.location })
        updateData.location_id = newLocation.id;
      }
    }
    
    // Update the recurring expense
    await pb.collection('recurring').update(recurring.id, updateData)
    
  } catch (error) {
    console.error("Error updating recurring expense:", error);
    throw error;
  }
};

// Delete recurring expense
export const deleteRecurringExpense = async (id: string): Promise<void> => {
  try {
    const pb = await getPocketBase();
    await pb.collection('recurring').delete(id)
    
  } catch (error) {
    console.error("Error deleting recurring expense:", error);
    throw error;
  }
};

// Generate expense from recurring expense
export const generateExpenseFromRecurring = async (recurringId: string): Promise<void> => {
  try {
    const pb = await getPocketBase();
    
    // Get the recurring expense
    const recurring: any = await pb.collection('recurring').getOne(recurringId, {
      fields: 'id,amount,next_due_date,frequency,description,user_id,category_id,location_id,split_type'
    })
    
    // Create an expense from the recurring expense
    const expenseDate = recurring.next_due_date;
    const monthString = format(parseISO(expenseDate), 'yyyy-MM');

    await pb.collection('expenses').create({
      amount: recurring.amount,
      date: expenseDate,
      month: monthString,
      description: recurring.description,
      paid_by_id: recurring.user_id,
      category_id: recurring.category_id,
      location_id: recurring.location_id,
      split_type: recurring.split_type || '50/50'
    })
    
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
    await pb.collection('recurring').update(recurringId, {
      next_due_date: format(nextDueDate, 'yyyy-MM-dd')
    })
    
  } catch (error) {
    console.error("Error generating expense from recurring:", error);
    throw error;
  }
};

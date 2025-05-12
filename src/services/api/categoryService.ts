import { getSupabase } from "@/integrations/supabase/client";

// Get all categories from Supabase
export const getCategories = async () => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, color, icon')
    .order('name');
    
  if (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
  
  return data;
};

// Create new category
export const createCategory = async (name: string, icon?: string, color?: string): Promise<{ id: string, name: string, icon?: string, color?: string }> => {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, icon, color })
      .select('id, name, icon, color')
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
};

// Delete category
export const deleteCategory = async (id: string): Promise<void> => {
  try {
    const supabase = await getSupabase();
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};

// Check if a category is currently used in any expenses
export const checkCategoryUsage = async (categoryName: string): Promise<boolean> => {
  try {
    const supabase = await getSupabase();
    
    // Check expenses table for existence
    // @ts-expect-error - TS2589: Type instantiation is excessively deep and possibly infinite. Exhausted refactoring attempts, likely upstream issue.
    const { data: expenseData, error: expenseError } = await supabase
      .from('expenses')
      .select('id', { head: true })
      .eq('category', categoryName)
      .limit(1);

    if (expenseError) throw expenseError;
    if (expenseData && expenseData.length > 0) return true;

    // Check recurring table for existence
    // @ts-expect-error - TS2589: Type instantiation is excessively deep and possibly infinite. Exhausted refactoring attempts, likely upstream issue.
    const { data: recurringData, error: recurringError } = await supabase
      .from('recurring')
      .select('id', { head: true })
      .eq('category', categoryName)
      .limit(1);

    if (recurringError) throw recurringError;
    if (recurringData && recurringData.length > 0) return true;

    return false; // Not used

  } catch (error) {
    console.error("Error checking category usage:", error);
    // Assume used on error for safety
    return true; 
  }
};

import { getSupabase } from "@/integrations/supabase/client";

// Get all locations from Supabase
export const getLocations = async () => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('locations')
    .select('id, name')
    .order('name');
    
  if (error) {
    console.error("Error fetching locations:", error);
    throw error;
  }
  
  return data;
};

// Create new location
export const createLocation = async (name: string): Promise<{ id: string, name: string }> => {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('locations')
      .insert({ name })
      .select('id, name')
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error creating location:", error);
    throw error;
  }
};

// Check if a location is currently used in any expenses
export const checkLocationUsage = async (locationId: string): Promise<boolean> => {
  try {
    const supabase = await getSupabase();
    
    // Check expenses table for existence
    const { data: expenseData, error: expenseError } = await supabase
      .from('expenses')
      .select('id', { head: true }) // Select minimal data, head only
      .eq('location_id', locationId)
      .limit(1); // We only need to know if at least one exists

    if (expenseError) throw expenseError;
    if (expenseData && expenseData.length > 0) return true; // Found usage in expenses

    // Check recurring table for existence
    const { data: recurringData, error: recurringError } = await supabase
      .from('recurring') // Use 'recurring' table name
      .select('id', { head: true }) // Select minimal data, head only
      .eq('location_id', locationId)
      .limit(1); // We only need to know if at least one exists

    if (recurringError) throw recurringError;
    if (recurringData && recurringData.length > 0) return true; // Found usage in recurring

    return false; // Not used

  } catch (error) {
    console.error("Error checking location usage:", error);
    // Decide if we should prevent deletion on error, safer to assume it's used
    return true; 
  }
};

// Delete location
export const deleteLocation = async (id: string): Promise<void> => {
  try {
    const supabase = await getSupabase();
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  } catch (error) {
    console.error("Error deleting location:", error);
    throw error;
  }
};

import { getPocketBase } from "@/integrations/pocketbase/client";

// Get all locations from Supabase
export const getLocations = async () => {
  const pb = await getPocketBase();
  const list = await pb.collection('locations').getFullList({
    sort: 'name',
    fields: 'id,name'
  });
  return list;
};

// Create new location
export const createLocation = async (name: string): Promise<{ id: string, name: string }> => {
  try {
    const pb = await getPocketBase();
    const data: any = await pb.collection('locations').create({ name });
    if (!data || !data.id) {
      throw new Error("Location was not properly saved to database");
    }
    return { id: data.id, name: data.name };
  } catch (error) {
    console.error("Error creating location:", error);
    throw error;
  }
};

// Check if a location is currently used in any expenses
export const checkLocationUsage = async (locationId: string): Promise<boolean> => {
  try {
    const pb = await getPocketBase();
    const expenses = await pb.collection('expenses').getList(1, 1, {
      filter: `location_id = "${locationId}"`,
      fields: 'id'
    });
    if (expenses.totalItems > 0) return true;

    const recurring = await pb.collection('recurring').getList(1, 1, {
      filter: `location_id = "${locationId}"`,
      fields: 'id'
    });
    if (recurring.totalItems > 0) return true;

    return false;

  } catch (error) {
    console.error("Error checking location usage:", error);
    // Decide if we should prevent deletion on error, safer to assume it's used
    return true; 
  }
};

// Delete location
export const deleteLocation = async (id: string): Promise<void> => {
  try {
    const pb = await getPocketBase();
    await pb.collection('locations').delete(id);
  } catch (error) {
    console.error("Error deleting location:", error);
    throw error;
  }
};

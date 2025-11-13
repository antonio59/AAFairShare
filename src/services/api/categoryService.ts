import { getPocketBase } from "@/integrations/pocketbase/client";

// Get all categories from Supabase
export const getCategories = async () => {
  const pb = await getPocketBase();
  const list = await pb.collection('categories').getFullList({
    sort: 'name',
    fields: 'id,name,color,icon'
  })
  return list;
};

// Create new category
export const createCategory = async (name: string, icon?: string, color?: string): Promise<{ id: string, name: string, icon?: string, color?: string }> => {
  try {
    const pb = await getPocketBase();
    const data: any = await pb.collection('categories').create({ name, icon, color })
    if (!data || !data.id) {
      throw new Error("Category was not properly saved to database");
    }
    return { id: data.id, name: data.name, icon: data.icon, color: data.color };
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
};

// Delete category
export const deleteCategory = async (id: string): Promise<void> => {
  try {
    const pb = await getPocketBase();
    await pb.collection('categories').delete(id);
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};

// Check if a category is currently used in any expenses
export const checkCategoryUsage = async (categoryName: string): Promise<boolean> => {
  try {
    const pb = await getPocketBase();

    let category: any | null = null;
    try {
      category = await pb.collection('categories').getFirstListItem(`name="${categoryName}"`, { fields: 'id' });
    } catch (_) {
      category = null;
    }
    if (!category?.id) return false;

    const expenses = await pb.collection('expenses').getList(1, 1, {
      filter: `category_id = "${category.id}"`,
      fields: 'id'
    });
    if (expenses.totalItems > 0) return true;

    const recurring = await pb.collection('recurring').getList(1, 1, {
      filter: `category_id = "${category.id}"`,
      fields: 'id'
    });
    if (recurring.totalItems > 0) return true;

    return false;

  } catch (error) {
    console.error("Error checking category usage:", error);
    return true;
  }
};

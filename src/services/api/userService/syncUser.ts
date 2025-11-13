
import { getPocketBase } from "@/integrations/pocketbase/client";
import { User } from "@/types";
import { showToast } from "@/components/ui/use-toast";

// Check if authenticated user exists in users table - no creation for closed app
export const syncAuthUser = async (): Promise<User | null> => {
  try {
    const pb = await getPocketBase();
    const model: any = pb.authStore.model
    if (!model) return null
    return {
      id: model.id,
      name: model.username || (model.email?.split('@')[0] || 'User'),
      avatar: model.avatar || model.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${model.username || model.email}`
    }
  } catch (error) {
    console.error("Error syncing auth user:", error);
    return null;
  }
};

// Fetch users from the Supabase database
export const getUsers = async (): Promise<User[]> => {
  const pb = await getPocketBase();
  const records = await pb.collection('users').getFullList({ fields: 'id,username,email,avatar,photo_url' })
  return records.map((user: any) => ({
    id: user.id,
    name: user.username || (user.email?.split('@')[0] || 'User'),
    avatar: user.avatar || user.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || user.email}`,
    email: user.email
  }))
};


import { getPocketBase } from "@/integrations/pocketbase/client";
import { User } from "@/types";
import { syncAuthUser } from './syncUser';

// Get current authenticated user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    console.log("Getting current user...");
    
    const pb = await getPocketBase();
    const model: any = pb.authStore.model
    if (!model) {
      console.log("No active session")
      return null
    }
    console.log("Active session found for user:", model.email)
    return {
      id: model.id,
      name: model.username || (model.email?.split('@')[0] || 'User'),
      avatar: model.avatar || model.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${model.username || model.email}`
    }
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

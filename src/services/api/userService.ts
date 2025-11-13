import { getPocketBase } from "@/integrations/pocketbase/client";
import { User } from "@/types";

export const getUsers = async (): Promise<User[]> => {
  try {
    const pb = await getPocketBase();
    const records = await pb.collection('users').getFullList({
      fields: 'id,username,email,avatar,photo_url'
    })

    const mappedUsers: User[] = (records || []).map((profile: any) => ({
      id: profile.id,
      username: profile.username || profile.email || 'Anonymous',
      email: profile.email,
      avatar: profile.avatar || profile.photo_url || undefined,
    }));

    return mappedUsers;

  } catch (error) {
    console.error("Failed in getUsers:", error);
    throw new Error(`Failed to get users: ${error instanceof Error ? error.message : String(error)}`);
  }
};

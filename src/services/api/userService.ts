import { getSupabase } from "@/integrations/supabase/client";
import { User } from "@/types";

export const getUsers = async (): Promise<User[]> => {
  try {
    const supabase = await getSupabase();

    // Fetching from the 'public.users' table
    const { data, error } = await supabase
      .from('users') 
      .select('id, username, email, photo_url'); // Corrected to photo_url

    if (error) {
      console.error("Error fetching users from public.users table:", error);
      throw error;
    }

    // Map data to User[] ensuring photo_url is mapped to avatar
    const mappedUsers: User[] = (data || []).map(profile => ({
      id: profile.id,
      username: profile.username || profile.email || "Anonymous", 
      email: profile.email,
      avatar: profile.photo_url || undefined, // Corrected to map photo_url to avatar
    }));

    return mappedUsers;

  } catch (error) {
    console.error("Failed in getUsers:", error);
    throw new Error(`Failed to get users: ${error instanceof Error ? error.message : String(error)}`);
  }
};

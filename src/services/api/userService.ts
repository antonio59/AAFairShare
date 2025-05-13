import { getSupabase } from "@/integrations/supabase/client";
import { User } from "@/types"; // Make sure this User type matches your actual user structure

export const getUsers = async (): Promise<User[]> => {
  try {
    const supabase = await getSupabase();

    // Fetching from the 'users' table
    // Ensure your 'users' table has columns like 'id' (UUID),
    // 'name', 'email', etc., and that RLS policies allow fetching.
    const { data, error } = await supabase
      .from('users') // Changed from 'profiles'
      .select('*'); // Select all columns or specify needed ones: 'id, name, email'

    if (error) {
      console.error("Error fetching users from users table:", error);
      throw error;
    }
    return data || [];

    // Option 2: If you are only using Supabase Auth ... (commented out for reference)
    /*
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("Error fetching users from Supabase Auth:", authError);
      throw authError;
    }

    if (!authUsers) return [];

    return authUsers.map(user => ({
      id: user.id, // UUID
      name: user.user_metadata?.full_name || user.email || "Unknown User", // Adjust as needed
      email: user.email,
      // Add other properties to match your User type if necessary
    })) as User[];
    */
  } catch (error) {
    console.error("Failed in getUsers:", error);
    // Depending on how your app handles errors, you might want to return [] or rethrow
    throw new Error(`Failed to get users: ${error instanceof Error ? error.message : String(error)}`);
  }
};

import { useState, useEffect, ReactNode, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/types";
import { getSupabase, cleanupAuthState } from "@/integrations/supabase/client";
import { logoutUser } from "@/services/api/auth/authUtilities";
import { AuthContext } from "./AuthContext";

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to get user profile from 'users' table based on auth user
const getCurrentUserProfile = async (): Promise<User | null> => {
  const supabase = await getSupabase();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) {
    console.log("No authenticated user found or error fetching auth user:", authError?.message);
    return null;
  }

  // Now fetch the profile from the 'users' table
  const { data: profileData, error: profileError } = await supabase
    .from('users')
    .select('*') // Select specific columns: 'id, name, email, ...'
    .eq('id', authUser.id)
    .single(); // Expecting only one user

  if (profileError) {
    console.error(`Error fetching profile for user ${authUser.id}:`, profileError.message);
    // Decide if this should throw or return null depending on UX
    return null;
  }

  return profileData as User | null; // Cast to your User type
};

// Helper function to sync auth user data to 'users' table and return profile
const syncCurrentUserProfile = async (): Promise<User | null> => {
  const supabase = await getSupabase();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) {
    console.log("No authenticated user found for sync or error fetching auth user:", authError?.message);
    return null;
  }

  // Data to upsert into 'users' table
  // Adjust fields based on your 'users' table columns and authUser metadata
  const userProfileData = {
    id: authUser.id, // MUST match the auth user's ID
    email: authUser.email,
    // name: authUser.user_metadata?.full_name || authUser.email, // Example: get name
    // last_sign_in_at: authUser.last_sign_in_at, // Example
    // Add/map other necessary fields from authUser or metadata to your table columns
  };

  // Upsert the profile data
  const { data: upsertedData, error: upsertError } = await supabase
    .from('users')
    .upsert(userProfileData, { onConflict: 'id' }) // Assumes 'id' is the PK/conflict target
    .select() // Select the data after upserting
    .single(); // Expecting one record back

  if (upsertError) {
    console.error(`Error upserting profile for user ${authUser.id}:`, upsertError.message);
    // Decide how to handle upsert errors - maybe fetch existing profile?
    // For now, try fetching the existing profile as a fallback
    return getCurrentUserProfile(); 
  }

  console.log(`User profile synced/upserted for ${authUser.id}`);
  return upsertedData as User | null;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("Initializing...");
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();
  
  const loadUserData = useCallback(async () => {
    try {
      setLoadingText("Loading user data...");
      console.log("Loading user data, attempt:", retryCount + 1);
      
      // Try fetching the profile directly
      let currentUser = await getCurrentUserProfile(); // Use the new function
      
      // If that fails, try to sync auth user and fetch profile
      if (!currentUser && retryCount < 2) {
        setLoadingText("Synchronizing user data...");
        console.log("Attempting to sync auth user...");
        currentUser = await syncCurrentUserProfile(); // Use the new function
      }
      
      if (currentUser) {
        console.log("User data loaded successfully:", currentUser.name);
        setUser(currentUser);
        setIsLoading(false);
      } else {
        // If we still can't get a user after retries, go to the login page
        console.warn("Could not retrieve user data, redirecting to login");
        toast({
          title: "Authentication error",
          description: "Please login again",
          variant: "destructive",
        });
        
        // Mark auth error for cleanup on next load, but don't automatically clean up
        localStorage.setItem('auth-error-detected', 'true');
        
        navigate('/login', { replace: true });
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
      if (retryCount < 2) {
        const delay = Math.pow(2, retryCount) * 1000;
        setRetryCount(prevCount => prevCount + 1);
        setTimeout(() => {
          loadUserData(); // This will call the memoized version
        }, delay);
      } else {
        setIsLoading(false);
        navigate('/login', { replace: true });
      }
    }
  }, [retryCount, toast, navigate, setLoadingText, setUser, setIsLoading, setRetryCount]);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await logoutUser();
      toast({
        title: "Logout successful",
        description: "You have been logged out successfully."
      });
      // Force a page reload for clean state
      window.location.href = '/login';
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        title: "Logout failed",
        description: "An error occurred during logout",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        if (!isMounted) return;
        setIsLoading(true);
        setLoadingText("Checking authentication...");
        
        // First check for existing session
        console.log("Checking for existing session...");
        const supabase = await getSupabase();
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          if (isMounted) {
            toast({
              title: "Session error",
              description: "Please login again",
              variant: "destructive",
            });
            navigate('/login', { replace: true });
            setIsLoading(false);
          }
          return;
        }
        
        if (!session) {
          if (isMounted) {
            console.log("No active session found, redirecting to login");
            navigate('/login', { replace: true });
            setIsLoading(false);
          }
          return;
        }
        
        console.log("Active session found, user ID:", session.user.id);
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (!isMounted) return;
            
            console.log("Auth state changed:", event);
            
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              // Defer loading user data to avoid potential deadlocks
              setTimeout(() => {
                if (isMounted) loadUserData();
              }, 0);
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              navigate('/login', { replace: true });
            }
          }
        );
        
        // Load user data asynchronously
        await loadUserData();
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Auth error:", error);
        if (isMounted) {
          setIsLoading(false);
          navigate('/login', { replace: true });
        }
      }
    };
    
    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, [navigate, toast, loadUserData]);

  return (
    <AuthContext.Provider value={{ user, isLoading, loadingText, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

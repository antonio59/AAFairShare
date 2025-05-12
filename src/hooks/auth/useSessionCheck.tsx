import { NavigateFunction } from 'react-router-dom';
import { getSupabase, isOnline } from '@/integrations/supabase/client';
import { checkSupabaseConnection } from '@/services/api/auth/authUtilities';

interface SessionCheckProps {
  setErrorMessage: (message: string | null) => void;
  setAuthChecked: (checked: boolean) => void;
}

export const useSessionCheck = ({ setErrorMessage, setAuthChecked }: SessionCheckProps) => {
  const checkSession = async (navigate: NavigateFunction) => {
    try {
      console.log("Checking session on login page...");
      
      // Check network status first
      if (!isOnline()) {
        setAuthChecked(true);
        return;
      }
      
      // Check Supabase connection before attempting to get session
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        console.error("Cannot connect to Supabase");
        setErrorMessage("Cannot connect to authentication service. Please check your internet connection.");
        setAuthChecked(true);
        return;
      }
      
      // Get supabase client and session
      const supabase = await getSupabase();
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Session error:", error);
        setErrorMessage("Error checking authentication status: " + error.message);
        setAuthChecked(true);
        return;
      }
      
      if (data.session) {
        console.log("Active session found, redirecting to home");
        navigate('/');
      }
    } catch (error: unknown) {
      console.error("Error checking session:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      setErrorMessage("Session check failed: " + message);
    } finally {
      setAuthChecked(true);
    }
  };

  return { checkSession };
};

import { NavigateFunction } from 'react-router-dom';
import { getPocketBase, isOnline } from '@/integrations/pocketbase/client';
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
      
      // Check PocketBase connection before attempting to get session
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        console.error("Cannot connect to PocketBase");
        setErrorMessage("Cannot connect to authentication service. Please check your internet connection.");
        setAuthChecked(true);
        return;
      }
      
      const pb = await getPocketBase();
      if (pb.authStore.isValid) {
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

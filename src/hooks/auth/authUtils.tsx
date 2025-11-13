import { isOnline } from '@/integrations/pocketbase/client';
import { showToast } from '@/components/ui/use-toast';
import { cleanupAuthState } from '@/integrations/pocketbase/client';
import { checkSupabaseConnection } from '@/services/api/auth/authUtilities';

export const validateLoginInputs = (email: string, password: string) => {
  if (!email.trim()) {
    return "Email is required";
  }
  
  if (!password.trim()) {
    return "Password is required";
  }
  
  return null;
};

export const validateSignupInputs = (email: string, password: string) => {
  if (!email.trim()) {
    return "Email is required";
  }
  
  if (!password.trim() || password.length < 6) {
    return "Password must be at least 6 characters";
  }
  
  return null;
};

export const checkConnectionAndSupabase = async () => {
  // Check if we're online
  if (!isOnline()) {
    return {
      isConnected: false,
      error: "You appear to be offline. Please check your internet connection and try again."
    };
  }
  
  // Check Supabase connection
  const isConnected = await checkSupabaseConnection();
  if (!isConnected) {
    return {
      isConnected: false,
      error: "Cannot connect to authentication service. Please check your internet connection."
    };
  }
  
  return { isConnected: true, error: null };
};

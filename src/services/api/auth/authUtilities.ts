import { getSupabase, isOnline, cleanupAuthState, forceSignOut } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";

/**
 * Check network connection and Supabase availability
 */
export const checkConnectionAndSupabase = async () => {
  try {
    // First check if we're online
    if (!isOnline()) {
      return {
        isConnected: false,
        error: "You appear to be offline. Please check your internet connection."
      };
    }
    
    // Try to connect to Supabase
    const isConnected = await checkSupabaseConnection(1);
    if (!isConnected) {
      return {
        isConnected: false,
        error: "Cannot connect to authentication service. Please try again later."
      };
    }
    
    return { isConnected: true };
  } catch (error) {
    console.error("Connection check error:", error);
    return {
      isConnected: false,
      error: error instanceof Error ? error.message : "Unknown connection error"
    };
  }
};

/**
 * Validate login inputs
 */
export const validateLoginInputs = (email: string, password: string) => {
  // Improved validation
  if (!email || typeof email !== 'string') {
    return "Valid email is required";
  }
  
  if (!password || typeof password !== 'string') {
    return "Password is required";
  }
  
  if (password.length < 6) {
    return "Password must be at least 6 characters";
  }
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address";
  }
  
  return null;
};

/**
 * Log in a user with email and password
 */
export const loginWithEmailAndPassword = async (
  email: string,
  password: string
) => {
  try {
    // Sanitize inputs for logging (don't log actual values)
    const sanitizedEmail = email ? `${email.substring(0, 2)}***@${email.split('@')[1] || ''}` : 'empty';
    console.log(`Attempting login for: ${sanitizedEmail}`);
    
    // Clean up existing state
    cleanupAuthState();
    
    // Try to sign out first to ensure clean state
    await forceSignOut();
    
    // Get supabase client
    const supabase = await getSupabase();
    
    // Sign in with Supabase
    console.log("Sending sign-in request to Supabase");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    // Log success without sensitive info
    console.log("Login successful, session established:", !!data.session);
    
    toast({
      title: "Login successful",
      description: "Welcome back!"
    });
    
    return { success: true, data };
  } catch (error: unknown) {
    console.error("Login error:", error);
    
    let errorMessage = "An error occurred during login. Please try again.";
    let errorCode: string | undefined = undefined;

    if (error instanceof Error) {
      errorMessage = error.message;
      // Check if 'code' property exists on the error object
      if (typeof error === 'object' && error !== null && 'code' in error) {
        errorCode = (error as { code: string }).code;
      }
    }
    
    if (!navigator.onLine || errorMessage.toLowerCase().includes('fetch') || errorCode === 'NETWORK_ERROR') {
      errorMessage = "Network connection problem. Please check your internet connection and try again.";
    } else if (errorMessage.includes('Invalid login credentials')) { 
      errorMessage = "Invalid email or password. Please try again.";
    } else {
      errorMessage = error instanceof Error ? error.message : "An error occurred during login. Please try again.";
    }
    
    // Sanitize any error messages for sensitive data
    errorMessage = errorMessage.replace(new RegExp(email, 'gi'), '[EMAIL]');
    
    toast({
      title: "Login failed",
      description: errorMessage,
      variant: "destructive"
    });
    
    return { success: false, error: errorMessage };
  }
};

/**
 * Function to check Supabase connection with retry
 */
export const checkSupabaseConnection = async (retries = 2): Promise<boolean> => {
  let attempt = 0;
  
  while (attempt <= retries) {
    try {
      // Get a client first
      const client = await getSupabase();
      
      // Simple check with getSession to verify if we can connect to Supabase
      const { data, error } = await client.auth.getSession();
      
      // If we can reach Supabase, consider it a successful connection
      return !error;
    } catch (e) {
      console.error(`Error checking Supabase connection (attempt ${attempt + 1}):`, e);
      attempt++;
      
      // Only wait between retries, not after the last one
      if (attempt <= retries) {
        await new Promise(resolve => setTimeout(resolve, 1500 * attempt));
      }
    }
  }
  
  return false;
};

/**
 * Logout the current user
 */
export const logoutUser = async (): Promise<void> => {
  try {
    toast({
      title: "Logging out...",
      description: "Please wait"
    });
    
    // Try to sign out first
    try {
      const supabase = await getSupabase();
      await supabase.auth.signOut({ scope: 'global' });
      console.log("Successfully signed out from Supabase");
    } catch (err) {
      console.error("Error during signOut:", err);
      // Continue even if this fails
    }
    
    // Then clean up regardless of signOut success
    cleanupAuthState();
    
    toast({
      title: "Logged out successfully",
      description: "You have been logged out successfully"
    });
    
    // Force page reload for clean state
    window.location.href = '/login';
  } catch (error) {
    console.error("Error during logout:", error);
    // Still clean up even if signOut fails
    cleanupAuthState();
    // Force reload even on error for clean state
    window.location.href = '/login';
  }
};

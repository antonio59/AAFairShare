import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { isOnline, getSupabase, cleanupAuthState } from "@/integrations/supabase/client";
import { AuthProvider } from "@/providers/AuthProvider";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Settlement from "./pages/Settlement";
import Analytics from "./pages/Analytics";
import Recurring from "./pages/Recurring";
import Settings from "./pages/Settings";
import AddExpense from "./pages/AddExpense";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WifiOff, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import TestEmail from "./pages/TestEmail";

// Initialize QueryClient with default settings for better performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isOnlineStatus, setIsOnlineStatus] = useState<boolean>(isOnline());
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSupabaseReady, setIsSupabaseReady] = useState<boolean>(false);
  
  // Network status listener
  useEffect(() => {
    const handleOnline = () => setIsOnlineStatus(true);
    const handleOffline = () => setIsOnlineStatus(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Initialize Supabase client
  useEffect(() => {
    const initSupabase = async () => {
      try {
        await getSupabase();
        setIsSupabaseReady(true);
      } catch (error) {
        console.error("Failed to initialize Supabase:", error);
        setAuthError("Failed to initialize database connection. Please try again later.");
      }
    };
    
    initSupabase();
  }, []);
  
  // Initial auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we're online and Supabase is ready
        if (!isOnline() || !isSupabaseReady) {
          setIsAuthenticated(false);
          if (!isOnline()) {
            setAuthError("You appear to be offline. Please check your internet connection.");
          }
          return;
        }
        
        // Get session
        const supabase = await getSupabase();
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth check error:", error);
          setAuthError(error.message);
          setIsAuthenticated(false);
          return;
        }
        
        setIsAuthenticated(!!data.session);
      } catch (error: unknown) {
        console.error("Auth check exception:", error);
        let errorMessage = "Unknown authentication error";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        setAuthError(errorMessage);
        setIsAuthenticated(false);
      }
    };
    
    if (isSupabaseReady) {
      checkAuth();
    }
  }, [isSupabaseReady]);
  
  const handleResetAuth = () => {
    // Clean up all auth tokens
    cleanupAuthState();
    // Force reload the app
    window.location.reload();
  };
  
  // Show loading state while checking auth or initializing Supabase
  if (isAuthenticated === null || !isSupabaseReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="font-medium">Initializing app...</p>
          <p className="text-sm text-gray-500">
            {!isSupabaseReady ? "Connecting to database..." : "Checking authentication..."}
          </p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={handleResetAuth}
          >
            Reset Authentication
          </Button>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (authError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg flex flex-col items-center gap-3 max-w-md text-center p-6">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <p className="font-medium text-xl">Authentication Error</p>
          <p className="text-gray-700">{authError}</p>
          <div className="flex gap-3 mt-4">
            <Button onClick={handleResetAuth}>Reset Authentication</Button>
            <Button variant="outline" onClick={() => window.location.href = '/login'}>
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {!isOnlineStatus && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white p-2 text-center">
            <Alert variant="destructive">
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                You are currently offline. Some features may not work properly.
              </AlertDescription>
            </Alert>
          </div>
        )}
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/test-email" element={<TestEmail />} />
            <Route path="/" element={
              <AuthProvider>
                <AppLayout />
              </AuthProvider>
            }>
              <Route index element={<Dashboard />} />
              <Route path="settlement" element={<Settlement />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="recurring" element={<Recurring />} />
              <Route path="settings" element={<Settings />} />
              <Route path="add-expense" element={<AddExpense />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

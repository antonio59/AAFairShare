import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabase, isOnline } from '@/integrations/supabase/client';
import { checkSupabaseConnection } from '@/services/api/auth/authUtilities';
import { Loader2, WifiOff, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/use-toast';

const Index = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'checking' | 'error' | 'offline' | 'redirecting'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we're online first
        if (!isOnline()) {
          console.log("Offline detected, showing login");
          setStatus('offline');
          return;
        }
        
        // Check if Supabase is available
        const isConnected = await checkSupabaseConnection();
        if (!isConnected) {
          console.error("Cannot connect to Supabase");
          setStatus('error');
          setErrorMessage("Cannot connect to authentication service. Please try again later.");
          return;
        }
        
        // Clean up existing state if issues detected
        if (localStorage.getItem('auth-error-detected') === 'true') {
          console.log("Auth error detected, cleaning up state");
          localStorage.removeItem('auth-error-detected');
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith('supabase.auth.') || key.includes('sb-') || key.includes('aafairshare-auth')) {
              localStorage.removeItem(key);
            }
          });
        }
        
        console.info("Main entry point loading");
        setStatus('redirecting');
        
        const supabase = await getSupabase();
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          setStatus('error');
          setErrorMessage(error.message);
          navigate('/login');
          return;
        }
        
        if (data.session) {
          console.log("Session found, redirecting to dashboard");
          navigate('/');
        } else {
          console.log("No session found, redirecting to login");
          navigate('/login');
        }
        
        console.info("App rendered successfully");
      } catch (error: unknown) {
        console.error("Auth check error:", error);
        setStatus('error');
        const message = error instanceof Error ? error.message : "Authentication check failed";
        setErrorMessage(message);
        navigate('/login');
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleRetry = () => {
    setStatus('checking');
    setErrorMessage(null);
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-4xl font-bold mb-4">Welcome to AAFairShare</h1>
        
        {status === 'checking' && (
          <>
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
            <p className="text-xl text-gray-600">Loading your dashboard...</p>
          </>
        )}
        
        {status === 'redirecting' && (
          <>
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
            <p className="text-xl text-gray-600">Redirecting...</p>
          </>
        )}
        
        {status === 'offline' && (
          <Alert variant="destructive" className="mt-4">
            <WifiOff className="h-5 w-5" />
            <AlertTitle>You are offline</AlertTitle>
            <AlertDescription>
              You appear to be offline. Check your internet connection.
              <div className="mt-4">
                <Button onClick={handleRetry}>Retry</Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {status === 'error' && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              {errorMessage || "An error occurred while connecting to the service."}
              <div className="mt-4">
                <Button onClick={handleRetry}>Retry</Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default Index;

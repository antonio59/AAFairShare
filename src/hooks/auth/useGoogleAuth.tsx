import { useState } from 'react';
import { getSupabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);

  const signInWithGoogle = async () => {
    console.log('[useGoogleAuth] Starting Google sign-in flow...');
    setIsLoading(true);
    
    try {
      console.log('[useGoogleAuth] Getting Supabase client...');
      const supabase = await getSupabase();
      console.log('[useGoogleAuth] Supabase client obtained, initiating OAuth...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
          skipBrowserRedirect: false,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      console.log('[useGoogleAuth] OAuth response:', { data, error });

      if (error) {
        console.error('[useGoogleAuth] OAuth error:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to sign in with Google',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      if (data?.url) {
        console.log('[useGoogleAuth] Redirecting to Google OAuth URL:', data.url);
        // The browser should redirect automatically, but we can force it if needed
        window.location.href = data.url;
      } else {
        console.error('[useGoogleAuth] No redirect URL returned from OAuth');
        toast({
          title: 'Error',
          description: 'Failed to initiate Google sign-in',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error('[useGoogleAuth] Exception during OAuth:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sign in with Google',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return {
    signInWithGoogle,
    isLoading,
  };
};

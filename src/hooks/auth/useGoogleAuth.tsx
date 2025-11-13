import { useState } from 'react';
import { getSupabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const supabase = await getSupabase();
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        console.error('Google OAuth error:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to sign in with Google',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
      // Note: If successful, browser will redirect to Google
      // So we don't need to setIsLoading(false) here
    } catch (error) {
      console.error('Google OAuth error:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign in with Google',
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

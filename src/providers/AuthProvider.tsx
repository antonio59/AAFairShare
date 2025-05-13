import { useState, useEffect, useCallback, ReactNode } from 'react';
import { Session, User as AuthUser } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { getSupabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { logoutUser as apiLogoutUser } from '@/services/api/auth/authUtilities'; 
import { toast } from '@/hooks/use-toast';
import { AuthContext, AuthContextType } from './AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [usersInSystem, setUsersInSystem] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const navigate = useNavigate();

  const fetchAllSystemUsersFromTable = useCallback(async (): Promise<User[]> => {
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('users')
        .select('id, username, email, photo_url');

      if (error) {
        console.error("[AuthProvider] fetchAllSystemUsersFromTable: Error fetching users from public.users table:", error);
        return []; // Return empty or handle error as appropriate
      }
      // Map data to User[] ensuring photo_url is mapped to avatar
      return (data || []).map(profile => ({
        id: profile.id,
        username: profile.username || profile.email || "Anonymous",
        email: profile.email,
        avatar: profile.photo_url || undefined,
      }));
    } catch (err) {
      console.error("[AuthProvider] fetchAllSystemUsersFromTable: Exception:", err);
      return [];
    }
  }, []);

  const syncAuthUserToPublicUsers = useCallback(async (authUser: AuthUser): Promise<User | null> => {
    if (!authUser || !authUser.id || !authUser.email) {
      console.warn('[AuthProvider] syncAuthUserToPublicUsers: AuthUser ID or email is missing. Cannot sync.');
      return null;
    }
    const supabase = await getSupabase();
    const userProfileData: Partial<User> & { id: string; email: string } = {
      id: authUser.id,
      email: authUser.email,
      username: authUser.user_metadata?.username || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'New User',
      photo_url: authUser.user_metadata?.photo_url || authUser.user_metadata?.avatar_url || undefined,
    };

    console.log('[AuthProvider] syncAuthUserToPublicUsers: Upserting profile with photo_url:', userProfileData.photo_url);
    const { data: upsertedData, error: upsertError } = await supabase
      .from('users')
      .upsert(userProfileData, { onConflict: 'id' })
      .select('id, username, email, photo_url')
      .single();

    if (upsertError) {
      console.error('[AuthProvider] syncAuthUserToPublicUsers: Error upserting profile:', upsertError);
      return {
        id: authUser.id,
        email: authUser.email,
        username: userProfileData.username,
        avatar: userProfileData.photo_url,
      };
    }
    console.log('[AuthProvider] syncAuthUserToPublicUsers: Profile upserted/fetched:', upsertedData);
    return upsertedData ? { ...upsertedData, avatar: upsertedData.photo_url } : null;
  }, []);

  const getCurrentUserProfile = useCallback(async (currentSession: Session | null): Promise<User | null> => {
    if (!currentSession?.user?.id) {
      console.log("[AuthProvider] getCurrentUserProfile: No session or user ID, returning null.");
      return null;
    }
    const supabase = await getSupabase();
    const { user: authUser } = currentSession;

    console.log(`[AuthProvider] getCurrentUserProfile: Fetching profile for user ID: ${authUser.id} from public.users`);
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('id, username, email, photo_url')
      .eq('id', authUser.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { 
      console.error('[AuthProvider] getCurrentUserProfile: Error fetching profile from public.users:', profileError);
      return {
        id: authUser.id,
        email: authUser.email || 'Error fetching email',
        username: authUser.user_metadata?.username || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Error User',
        avatar: authUser.user_metadata?.photo_url || authUser.user_metadata?.avatar_url || undefined,
      };
    }

    if (profileData) {
      console.log('[AuthProvider] getCurrentUserProfile: Profile found in public.users:', profileData);
      return { ...profileData, avatar: profileData.photo_url };
    }

    console.log('[AuthProvider] getCurrentUserProfile: Profile not found in public.users. Attempting to sync/create.');
    return await syncAuthUserToPublicUsers(authUser);
  }, [syncAuthUserToPublicUsers]);

  const fetchAllUsersInSystem = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const supabase = await getSupabase();
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const currentUserProfile = await getCurrentUserProfile(currentSession);
      
      const allSystemUsers = await fetchAllSystemUsersFromTable();
      setUsersInSystem(allSystemUsers.length > 0 ? allSystemUsers : (currentUserProfile ? [currentUserProfile] : []));
    } catch (error) {
      console.error("[AuthProvider] fetchAllUsersInSystem: Error fetching users:", error);
      setAuthError('Failed to refresh user data.');
      setUsersInSystem(user ? [user] : []);
    } finally {
      setLoading(false);
    }
  }, [getCurrentUserProfile, user, fetchAllSystemUsersFromTable]); 

  // Main useEffect for auth state setup
  useEffect(() => {
    // Define an async function to handle initialization
    const initializeAuth = async () => {
      setLoading(true);
      const supabaseClient = await getSupabase(); 
      
      supabaseClient.auth.getSession().then(async ({ data: { session: currentSession } }) => {
        setSession(currentSession);
        const currentUserProfile = await getCurrentUserProfile(currentSession);
        setUser(currentUserProfile);
        // Fetch all users after getting current user
        const allSystemUsers = await fetchAllSystemUsersFromTable();
        setUsersInSystem(allSystemUsers.length > 0 ? allSystemUsers : (currentUserProfile ? [currentUserProfile] : []));
      }).catch(error => {
        console.error("[AuthProvider] Error in initial getSession:", error);
        setAuthError('Failed to load initial session.');
      }).finally(() => {
        setLoading(false); 
        setInitialLoadComplete(true);
      });

      const { data: authListener } = supabaseClient.auth.onAuthStateChange(
        async (_event, newSession) => {
          console.log("[AuthProvider] onAuthStateChange: Event triggered", _event, newSession);
          setSession(newSession);
          const profile = await getCurrentUserProfile(newSession);
          setUser(profile);
          // Fetch all users after getting current user on auth change
          const allSystemUsers = await fetchAllSystemUsersFromTable();
          setUsersInSystem(allSystemUsers.length > 0 ? allSystemUsers : (profile ? [profile] : [])); 

          if (!initialLoadComplete) {
            setInitialLoadComplete(true); 
          }
        }
      );

      return () => {
        if (authListener && authListener.subscription && typeof authListener.subscription.unsubscribe === 'function') {
          authListener.subscription.unsubscribe();
        }
      };
    };

    let unsubscribeFunction: (() => void) | undefined;

    initializeAuth().then(cleanup => {
      unsubscribeFunction = cleanup;
    }).catch(err => {
      console.error("[AuthProvider] Critical error during auth initialization:", err);
      setAuthError("Failed to initialize authentication. Please try refreshing the page.");
      setLoading(false);
      setInitialLoadComplete(true); 
    });
    
    return () => {
      if (unsubscribeFunction) {
        unsubscribeFunction();
      }
    };
  }, [getCurrentUserProfile, initialLoadComplete, fetchAllSystemUsersFromTable]); // Main auth useEffect dependencies updated

  const handleLogout = async () => {
    console.log("[AuthProvider] handleLogout called"); // Added for debugging
    setLoading(true);
    try {
      await apiLogoutUser(); 
      setSession(null);
      setUser(null);
      setUsersInSystem([]);
      toast({ title: "Logged out", description: "You have been successfully logged out." });
    } catch (error) {
      console.error("[AuthProvider] Error during logout:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during logout.';
      setAuthError(errorMessage);
      toast({ title: "Logout Error", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Redirect logic useEffect - correctly placed and with correct dependencies
  useEffect(() => {
    if (!initialLoadComplete || loading) return; 

    const publicPaths = ['/login', '/register', '/forgot-password', '/update-password'];
    const currentPath = window.location.pathname;

    if (!session && !publicPaths.includes(currentPath)) {
      console.log("[AuthProvider] No session, not on public path, redirecting to /login. Current path:", currentPath);
      navigate("/login", { replace: true });
    } else if (session && publicPaths.includes(currentPath)) {
      console.log("[AuthProvider] Session active, on public path, redirecting to /dashboard. Current path:", currentPath);
      navigate("/dashboard", { replace: true });
    }
  }, [session, loading, navigate, initialLoadComplete]);

  const value = {
    session,
    user,
    users: usersInSystem,
    loading,
    authError,
    logout: handleLogout,
    refreshUsers: fetchAllUsersInSystem,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPocketBase } from '@/integrations/pocketbase/client';
import { User } from '@/types';
import { logoutUser as apiLogoutUser } from '@/services/api/auth/authUtilities'; 
import { toast } from '@/hooks/use-toast';
import { AuthContext, AuthContextType } from './AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [usersInSystem, setUsersInSystem] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const navigate = useNavigate();

  const fetchAllSystemUsersFromTable = useCallback(async (): Promise<User[]> => {
    try {
      const pb = await getPocketBase();
      const records = await pb.collection('users').getFullList({
        fields: 'id,username,email,avatar,photo_url'
      });
      return (records || []).map((r: any) => ({
        id: r.id,
        username: r.username || r.email || 'Anonymous',
        email: r.email,
        avatar: r.avatar || r.photo_url || undefined,
      }));
    } catch (err) {
      console.error("[AuthProvider] fetchAllSystemUsersFromTable: Exception:", err);
      return [];
    }
  }, []);

  const mapPocketBaseUser = useCallback((model: any | null): User | null => {
    if (!model) return null
    return {
      id: model.id,
      email: model.email,
      username: model.username || model.name || (model.email?.split('@')[0] || 'User'),
      avatar: model.avatar || model.photo_url || undefined,
    } as User
  }, [])

  const getCurrentUserProfile = useCallback(async (): Promise<User | null> => {
    const pb = await getPocketBase();
    return mapPocketBaseUser(pb.authStore.model)
  }, [mapPocketBaseUser])

  const fetchAllUsersInSystem = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const currentUserProfile = await getCurrentUserProfile();
      
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
      const pb = await getPocketBase();

      const token = pb.authStore.token || null
      setSession(token)
      const currentUserProfile = await getCurrentUserProfile()
      setUser(currentUserProfile)
      const allSystemUsers = await fetchAllSystemUsersFromTable()
      setUsersInSystem(allSystemUsers.length > 0 ? allSystemUsers : (currentUserProfile ? [currentUserProfile] : []))

      const unsubscribe = pb.authStore.onChange(async (_token, model) => {
        setSession(_token || null)
        const profile = mapPocketBaseUser(model)
        setUser(profile)
        const allUsers = await fetchAllSystemUsersFromTable()
        setUsersInSystem(allUsers.length > 0 ? allUsers : (profile ? [profile] : []))
        if (!initialLoadComplete) {
          setInitialLoadComplete(true)
        }
      })

      setLoading(false)
      setInitialLoadComplete(true)

      return () => {
        unsubscribe?.()
      }
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
  }, [getCurrentUserProfile, initialLoadComplete, fetchAllSystemUsersFromTable, mapPocketBaseUser]);

  const handleLogout = async () => {
    console.log("[AuthProvider] handleLogout called"); // Added for debugging
    setLoading(true);
    try {
      await apiLogoutUser(); 
      setSession(null);
      setUser(null);
      navigate('/login'); // Navigate to login page
      toast({ title: "Logged out", description: "You have been successfully logged out." });
    } catch (error) {
      console.error("[AuthProvider] Logout failed:", error);
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

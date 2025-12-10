import { ReactNode } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { AuthContext, AppUser } from "./AuthContext";
import { DEMO_MODE, demoUsers } from "@/lib/demoData";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const viewer = useQuery(api.users.viewer, isAuthenticated ? undefined : "skip");
  const allUsers = useQuery(api.users.getAll, isAuthenticated ? undefined : "skip");

  if (DEMO_MODE) {
    const demoUser: AppUser = {
      id: demoUsers[0].id,
      _id: demoUsers[0].id,
      username: demoUsers[0].username,
      email: demoUsers[0].email,
      avatar: demoUsers[0].avatar,
    };

    const demoAppUsers: AppUser[] = demoUsers.map((u) => ({
      id: u.id,
      _id: u.id,
      username: u.username,
      email: u.email,
      avatar: u.avatar,
    }));

    const value = {
      isAuthenticated: true,
      isLoading: false,
      user: demoUser,
      users: demoAppUsers,
      login: () => {},
      logout: async () => {},
      refreshUsers: async () => {},
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }

  const user: AppUser | null = viewer ? {
    id: viewer._id,
    _id: viewer._id,
    username: viewer.username,
    email: viewer.email || "",
    avatar: viewer.avatar,
  } : null;

  const users: AppUser[] = (allUsers ?? []).map((u) => ({
    id: u._id,
    _id: u._id,
    username: u.name || u.username || u.email?.split("@")[0] || "User",
    email: u.email || "",
    avatar: u.image || u.photoUrl,
  }));

  const login = () => {
    // Redirect to login page - the actual sign in happens there
    window.location.href = "/login";
  };

  const logout = async () => {
    await signOut();
  };

  const refreshUsers = async () => {
    // Convex automatically refetches
  };

  const value = {
    isAuthenticated,
    isLoading: authLoading || (isAuthenticated && viewer === undefined),
    user,
    users,
    login,
    logout,
    refreshUsers,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

import { ReactNode } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AuthContext, AppUser } from "./AuthContext";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const viewer = useQuery(api.users.viewer);
  const allUsers = useQuery(api.users.getAll);

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
    // Sign out is handled by the signOut function from Convex Auth
    const { signOut } = await import("@convex-dev/auth/react");
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

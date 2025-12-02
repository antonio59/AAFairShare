import { createContext, useContext } from "react";
import { Id } from "../../convex/_generated/dataModel";

export interface AppUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  _id?: Id<"users">;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AppUser | null;
  users: AppUser[];
  login: () => void;
  logout: () => void;
  refreshUsers: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

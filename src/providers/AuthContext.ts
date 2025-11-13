import { createContext } from "react";
import { User } from "@/types";

// Define the shape of the context data consistent with AuthProvider
export interface AuthContextType {
  session: string | null;
  user: User | null;
  users: User[];
  loading: boolean;
  authError: string | null;
  logout: () => Promise<void>;
  refreshUsers: () => Promise<void>;
}

// Create the context with a default value matching the new AuthContextType
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { createContext } from "react";
import { User } from "@/types";

// Define the shape of the context data
export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  loadingText: string;
  handleLogout: () => Promise<void>;
};

// Create the context with a default value
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  loadingText: "Initializing...",
  handleLogout: async () => {}, // Provide a no-op default for methods
});

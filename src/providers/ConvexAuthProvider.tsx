import { ReactNode, useMemo } from "react";
import { ConvexProviderWithAuth0 } from "convex/react-auth0";
import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL;

interface ConvexAuthProviderProps {
  children: ReactNode;
}

export function ConvexAuthProvider({ children }: ConvexAuthProviderProps) {
  const convex = useMemo(() => new ConvexReactClient(convexUrl), []);

  return (
    <ConvexProviderWithAuth0 client={convex}>
      {children}
    </ConvexProviderWithAuth0>
  );
}

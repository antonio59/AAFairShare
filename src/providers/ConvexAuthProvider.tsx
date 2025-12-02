import { ReactNode, useCallback, useMemo } from "react";
import { useAuth0 } from "@auth0/auth0-react";
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

export function useConvexAuth() {
  const { isAuthenticated, isLoading, getAccessTokenSilently, loginWithRedirect, logout, user } = useAuth0();

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      try {
        const token = await getAccessTokenSilently({
          cacheMode: forceRefreshToken ? "off" : "on",
        });
        return token;
      } catch {
        return null;
      }
    },
    [getAccessTokenSilently]
  );

  return {
    isAuthenticated,
    isLoading,
    fetchAccessToken,
    loginWithRedirect,
    logout,
    user,
  };
}

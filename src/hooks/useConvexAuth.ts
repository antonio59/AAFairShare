import { useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";

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

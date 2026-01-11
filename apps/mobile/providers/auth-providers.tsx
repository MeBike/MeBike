import type { AppStateStatus } from "react-native";

import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AppState } from "react-native";

import type { DetailUser } from "@services/auth.service";

import { useUserProfileQuery } from "@hooks/query/useUserProfileQuery";
import { useAuthActions } from "@hooks/useAuthAction";
import { clearTokens, getAccessToken } from "@utils/tokenManager";
import { Me } from "@/types";

type AuthError = {
  response?: {
    status: number;
  };
};
type AuthContextType = ReturnType<typeof useAuthActions> & {
  user: Me | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isStaff: boolean;
  isCustomer: boolean;
  isSOS: boolean;
  actions: ReturnType<typeof useAuthActions>;
};
import { DeviceEventEmitter } from "react-native";
import { TOKEN_EVENT } from "@utils/tokenManager";
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { data: userProfile, isLoading: isUserProfileLoading, isError, isSuccess } = useUserProfileQuery(hasToken);

  // Debug logging
  // console.log("AuthProvider state:", { hasToken, isInitialized });

  // Callback to update token state
  const syncTokenState = useCallback(async () => {
    try {
      const token = await getAccessToken();
      
      setHasToken(!!token);

      if (token) {
        // Ensure query is fresh after token update
        await queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      } else {
        // Only clear cache when transition from hasToken=true to false (logout)
        // or on initial check if no token
        queryClient.clear();
      }
    } finally {
      setIsInitialized(true);
    }
  }, [queryClient]);

  const actions = useAuthActions(navigation, syncTokenState);

  useEffect(() => {
    // Initial check
    syncTokenState();

    // Listen for manual token changes (login/logout/refresh)
    const subscription = DeviceEventEmitter.addListener(TOKEN_EVENT, syncTokenState);

    return () => {
      subscription.remove();
    };
  }, [syncTokenState]);

  // Handle 401/403 errors
  useEffect(() => {
    if (isError && hasToken && isInitialized) {
      const authError = isError as unknown as AuthError;
      const status = authError?.response?.status;
      const isAuthError = status === 401 || status === 403;

      if (isAuthError) {
        console.log("Auth error detected (401/403), logging out...");
        const logout = async () => {
          await clearTokens(); // This will trigger TOKEN_EVENT and syncTokenState
          queryClient.clear();
        };
        logout();
      }
    }
  }, [isError, hasToken, isInitialized, queryClient]);

  const value: AuthContextType = React.useMemo(() => {
    const user = userProfile as Me | null;
    const isAuthenticated = !!user && isSuccess && isInitialized;
    const role = user?.role;
    return {
      ...actions,
      user,
      isAuthenticated,
      isLoading: isUserProfileLoading || !isInitialized,
      isStaff: role === "STAFF",
      isCustomer: role === "USER",
      isSOS: role === "SOS",
      actions,
    };
  }, [userProfile, isUserProfileLoading, isSuccess, actions, isInitialized]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}

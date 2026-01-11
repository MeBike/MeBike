import type { AppStateStatus } from "react-native";

import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AppState, DeviceEventEmitter } from "react-native";

import type { Me } from "@/types";
import { useUserProfileQuery } from "@hooks/query/useUserProfileQuery";
import { useAuthActions } from "@hooks/useAuthAction";
import { clearTokens, getAccessToken, AUTH_EVENTS } from "@utils/tokenManager";

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
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { data: userProfile, isLoading: isUserProfileLoading, isError, isSuccess, refetch } = useUserProfileQuery(hasToken);

  // Debug logging
  console.log("AuthProvider render state:", { hasToken, isInitialized, user: !!userProfile, isSuccess });

  const handleTokenUpdate = useCallback(async () => {
    const token = await getAccessToken();
    console.log(">>> [Auth] handleTokenUpdate triggered, token exists:", !!token);
    setHasToken(!!token);
    if (!token) {
      console.log(">>> [Auth] No token, clearing cache");
      queryClient.clear();
    }
  }, [queryClient]);

  const actions = useAuthActions(navigation, handleTokenUpdate);

  useEffect(() => {
    const tokenUpdatedSub = DeviceEventEmitter.addListener(AUTH_EVENTS.TOKEN_UPDATED, () => {
      console.log(">>> [Auth] Event: TOKEN_UPDATED received");
      handleTokenUpdate();
    });

    const tokenRefreshedSub = DeviceEventEmitter.addListener("auth:token_refreshed", () => {
      console.log(">>> [Auth] Event: auth:token_refreshed received");
      handleTokenUpdate();
    });

    const sessionExpiredSub = DeviceEventEmitter.addListener("auth:session_expired", async () => {
      console.log(">>> [Auth] Event: auth:session_expired received");
      await clearTokens();
      setHasToken(false);
      queryClient.clear();
      navigation.navigate("Login" as never);
    });

    return () => {
      tokenUpdatedSub.remove();
      tokenRefreshedSub.remove();
      sessionExpiredSub.remove();
    };
  }, [handleTokenUpdate, queryClient, navigation]);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = await getAccessToken();
      console.log(">>> [Auth] Initializing, token exists:", !!token);
      setHasToken(!!token);
      setIsInitialized(true);
    };

    initializeAuth();

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        const token = await getAccessToken();
        setHasToken(!!token);
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (isError && hasToken && isInitialized) {
      const authError = isError as unknown as AuthError;
      const status = authError?.response?.status;
      if (status === 401 || status === 403) {
        console.log(">>> [Auth] Auth error detected, clearing state");
        const clearAuth = async () => {
          await clearTokens();
          setHasToken(false);
          queryClient.clear();
        };
        clearAuth();
      }
    }
  }, [isError, hasToken, queryClient, isInitialized]);

  const value: AuthContextType = React.useMemo(() => {
    const user = userProfile as Me | null;
    const isAuthenticated = !!user && isSuccess && isInitialized && hasToken;
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
  }, [userProfile, isUserProfileLoading, isSuccess, actions, isInitialized, hasToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}

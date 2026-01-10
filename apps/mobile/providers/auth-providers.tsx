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
  console.log("AuthProvider state:", { hasToken, isInitialized });

  // Callback to update hasToken when token is saved or cleared
  const handleTokenUpdate = useCallback(async () => {
    const token = await getAccessToken();
    setHasToken(!!token);
  }, [getAccessToken]);

  const actions = useAuthActions(navigation, handleTokenUpdate);
  useEffect(() => {
  // Hàm xử lý khi token thay đổi
  const syncTokenState = async () => {
    const token = await getAccessToken();
    console.log("Token event received, updating state:", !!token);
    
    setHasToken(!!token);

    if (token) {
      // Ép TanStack Query gọi lại API profile ngay lập tức
      // Điều này đảm bảo user profile luôn mới nhất sau khi login
      await queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    } else {
      queryClient.clear();
    }
  };

  // Khởi tạo lần đầu
  syncTokenState();

  // Đăng ký lắng nghe event từ TokenManager
  const subscription = DeviceEventEmitter.addListener(TOKEN_EVENT, syncTokenState);

  return () => {
    subscription.remove();
  };
}, [queryClient]);

  useEffect(() => {
    if (isError && hasToken && isInitialized) {
      const authError = isError as unknown as AuthError;
      const hasResponse = authError?.response && typeof authError.response === "object";
      const status = hasResponse && authError.response ? authError.response.status : undefined;
      const isAuthError = hasResponse && (status === 401 || status === 403);

      if (isAuthError) {
        const clearAuth = async () => {
          console.log("Auth error detected, clearing auth state");
          await clearTokens();
          setHasToken(false);
          queryClient.clear();
        };
        clearAuth();
      }
    }
  }, [isError, hasToken, queryClient, isInitialized]);

  // Additional effect to ensure queries are properly disabled when token is cleared
  useEffect(() => {
    if (!hasToken && isInitialized) {
      console.log("No token detected, clearing query cache");
      queryClient.clear();
    }
  }, [hasToken, isInitialized, queryClient]);

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

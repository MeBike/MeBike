"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuthActions } from "@hooks/useAuthAction";
import { getAccessToken , clearTokens} from "@/utils/tokenManager";
import { DetailUser } from "@/services/authService";
import { useQueryClient } from "@tanstack/react-query";
import { useUserProfileQuery } from "@hooks/query/useUserProfileQuery";
interface AuthError {
  response?: {
    status: number;
  };
}
type AuthContextType = ReturnType<typeof useAuthActions> & {
  user : DetailUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  actions : ReturnType<typeof useAuthActions>;
};
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider:React.FC<{children : React.ReactNode}> = ({ children }) => {
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const { data: userProfile, isLoading: isUserProfileLoading , isError , isSuccess  } = useUserProfileQuery(hasToken);
  const actions = useAuthActions();
  useEffect(() => {
    setHasToken(!!getAccessToken());
    setIsInitialized(true);
    const handleStorageChange = () => {
      setHasToken(!!getAccessToken());
    };
    const handleAuthFailure = () => {
      clearTokens();
      setHasToken(false);
      queryClient.clear();
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth:session_expired", handleAuthFailure);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth:session_expirekd", handleAuthFailure);
    };
  }, [queryClient, getAccessToken]);
  
  useEffect(() => {
    if (isError && hasToken && isInitialized) {
      const authError = isError as unknown as AuthError;
      const hasResponse = authError?.response && typeof authError.response === "object";
      const status = hasResponse && authError.response ? authError.response.status : undefined;
      const isAuthError = hasResponse && (status === 401 || status === 403);
      
      if (isAuthError) {
        clearTokens();
        setHasToken(false);
        queryClient.clear();
      }
    }
  }, [isError, hasToken, queryClient, isInitialized]);

 const value: AuthContextType = React.useMemo(() => {
    const user = userProfile as DetailUser || null;
    const isAuthenticated = !!user && isSuccess && isInitialized;
    return {
      ...actions,
      user,
      isAuthenticated,
      isLoading: isUserProfileLoading || !isInitialized,
      actions,
    };
  }, [userProfile, isUserProfileLoading, isSuccess, actions, isInitialized]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};

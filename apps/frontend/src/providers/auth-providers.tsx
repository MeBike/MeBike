"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuthActions } from "@hooks/useAuthAction";
import { getAccessToken , clearTokens} from "@/utils/tokenManager";
import { DetailUser } from "@/services/authService";
import { useQueryClient } from "@tanstack/react-query";
import { useUserProfileQuery } from "@hooks/query/useUserProfileQuery";
type AuthContextType = ReturnType<typeof useAuthActions> & {
  user : DetailUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  actions : ReturnType<typeof useAuthActions>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider:React.FC<{children : React.ReactNode}> = ({ children }) => {
  const [hasToken, setHasToken] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const { data: userProfile, isLoading: isUserProfileLoading , isError , isSuccess  } = useUserProfileQuery(hasToken);
  const actions = useAuthActions(setHasToken);
  useEffect(() => {
    setHasToken(!!getAccessToken());
    const handleStorageChange = () => {
      setHasToken(!!getAccessToken());
    };
    const handleAuthFailure = () => {
      clearTokens();
      setHasToken(false);
    }
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth:session_expired", handleAuthFailure);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth:session_expired", handleAuthFailure);
    };
  }, []);
    useEffect(() => {
    if (isError && hasToken) {
      queryClient.clear();
      setHasToken(false);
    }
  }, [isError, hasToken, queryClient]);

 const value: AuthContextType = React.useMemo(() => {
    const user = userProfile as DetailUser || null;
    const isAuthenticated = !!user && isSuccess;
    return {
      ...actions,
      user,
      isAuthenticated,
      isLoading: isUserProfileLoading,
      actions,
    };
  }, [userProfile, isUserProfileLoading, isSuccess, actions]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};

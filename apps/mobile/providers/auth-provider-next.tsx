import type { AuthError } from "@services/auth/auth-error";
import type { UserError } from "@services/users/user-error";

import { authQueryKeys } from "@hooks/query/auth-next/auth-query-keys";
import { useMeQuery } from "@hooks/query/auth-next/use-me-query";
import { clearTokens, getAccessToken, getRefreshToken } from "@lib/auth-tokens";
import { log } from "@lib/log";
import { authService } from "@services/auth/auth-service";
import { isUserApiError } from "@services/users/user-error";
import { useQueryClient } from "@tanstack/react-query";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type UserDetail = import("@services/users/user-service").UserDetail;

type AuthStatus = "loading" | "authenticated" | "unauthenticated";
type TokenState = "checking" | "missing" | "present";

function deriveAuthStatus({
  hasRecoverableSessionError,
  tokenState,
  user,
  isMePending,
}: {
  hasRecoverableSessionError: boolean;
  tokenState: TokenState;
  user: UserDetail | null;
  isMePending: boolean;
}): AuthStatus {
  if (tokenState === "checking") {
    return "loading";
  }

  if (tokenState === "missing") {
    return "unauthenticated";
  }

  if (user) {
    return "authenticated";
  }

  if (isMePending) {
    return "loading";
  }

  if (hasRecoverableSessionError) {
    return "authenticated";
  }

  return "unauthenticated";
}

type AuthContextValue = {
  status: AuthStatus;
  user: UserDetail | null;
  lastError: UserError | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isStaff: boolean;
  isTechnician: boolean;
  isCustomer: boolean;
  login: (payload: import("@services/auth/auth-service").LoginRequest) => Promise<AuthError | UserError | null>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
};

const AuthContextNext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProviderNext: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [tokenState, setTokenState] = useState<TokenState>("checking");
  const [sessionUser, setSessionUser] = useState<UserDetail | null>(null);

  const meQuery = useMeQuery(tokenState === "present");

  useEffect(() => {
    if (meQuery.data) {
      setSessionUser(meQuery.data);
    }
  }, [meQuery.data]);

  useEffect(() => {
    if (tokenState === "missing") {
      setSessionUser(null);
    }
  }, [tokenState]);

  useEffect(() => {
    let active = true;
    getAccessToken()
      .then((token) => {
        if (!active) {
          return;
        }
        setTokenState(token ? "present" : "missing");
      })
      .catch((err) => {
        log.warn("AuthProviderNext token check failed", err);
        if (active) {
          setTokenState("missing");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const error = meQuery.error;
    if (!error || tokenState !== "present") {
      return;
    }

    if (isUserApiError(error) && (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN")) {
      void clearTokens().finally(() => {
        setSessionUser(null);
        setTokenState("missing");
        queryClient.removeQueries({ queryKey: authQueryKeys.me() });
      });
    }
  }, [meQuery.error, queryClient, tokenState]);

  const hydrate = useCallback(async () => {
    const token = await getAccessToken();
    const nextTokenState = token ? "present" : "missing";
    setTokenState(nextTokenState);

    if (nextTokenState === "missing") {
      queryClient.removeQueries({ queryKey: authQueryKeys.me() });
      return;
    }

    await queryClient.invalidateQueries({ queryKey: authQueryKeys.me() });
  }, [queryClient]);

  const login = useCallback(
    async (
      payload: import("@services/auth/auth-service").LoginRequest,
    ): Promise<AuthError | UserError | null> => {
      const result = await authService.login(payload);
      if (!result.ok) {
        return result.error;
      }
      setTokenState("present");
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.me() });
      return null;
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      await authService.logout({ refreshToken });
    }
    await clearTokens();
    setSessionUser(null);
    setTokenState("missing");
    queryClient.removeQueries({ queryKey: authQueryKeys.me() });
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(() => {
    const user = meQuery.data ?? sessionUser;
    const role = user?.role;
    const isStaff = role === "STAFF";
    const isTechnician = role === "TECHNICIAN";
    const lastError = meQuery.error ?? null;
    const isAuthSessionError = meQuery.error
      ? isUserApiError(meQuery.error) && (meQuery.error.code === "UNAUTHORIZED" || meQuery.error.code === "FORBIDDEN")
      : false;
    const hasRecoverableSessionError = tokenState === "present"
      && Boolean(meQuery.error)
      && !isAuthSessionError;
    const status = deriveAuthStatus({
      hasRecoverableSessionError,
      tokenState,
      user,
      isMePending: meQuery.isPending,
    });
    return {
      status,
      user,
      lastError,
      isAuthenticated: status === "authenticated",
      isLoading: status === "loading",
      isStaff,
      isTechnician,
      isCustomer: role === "USER",
      login,
      logout,
      hydrate,
    };
  }, [meQuery.data, meQuery.error, meQuery.isPending, tokenState, sessionUser, login, logout, hydrate]);

  return <AuthContextNext.Provider value={value}>{children}</AuthContextNext.Provider>;
};

export function useAuthNext(): AuthContextValue {
  const ctx = useContext(AuthContextNext);
  if (!ctx) {
    throw new Error("useAuthNext must be used inside AuthProviderNext");
  }
  return ctx;
}

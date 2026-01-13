import type { AuthError } from "@services/auth/auth-error";
import type { UserError } from "@services/users/user-error";

import { useMeQuery } from "@hooks/query/auth-next/use-me-query";
import { clearTokens, getAccessToken, getRefreshToken } from "@lib/auth-tokens";
import { log } from "@lib/log";
import { authService } from "@services/auth/auth-service";
import { useQueryClient } from "@tanstack/react-query";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type UserDetail = import("@services/users/user-service").UserDetail;

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: UserDetail | null;
  lastError: UserError | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isStaff: boolean;
  isCustomer: boolean;
  isSOS: boolean;
  login: (payload: import("@services/auth/auth-service").LoginRequest) => Promise<AuthError | UserError | null>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
};

const AuthContextNext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProviderNext: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  const meQuery = useMeQuery(hasToken === true);

  useEffect(() => {
    let active = true;
    getAccessToken()
      .then((token) => {
        if (!active) {
          return;
        }
        setHasToken(Boolean(token));
      })
      .catch((err) => {
        log.warn("AuthProviderNext token check failed", err);
        if (active) {
          setHasToken(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const error = meQuery.error;
    if (!error || !hasToken) {
      return;
    }
    if (error._tag === "ApiError" && error.code === "UNAUTHORIZED") {
      void clearTokens().finally(() => {
        setHasToken(false);
        queryClient.removeQueries({ queryKey: ["authNext", "me"] });
      });
    }
  }, [meQuery.error, hasToken, queryClient]);

  const hydrate = useCallback(async () => {
    if (!hasToken) {
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["authNext", "me"] });
  }, [hasToken, queryClient]);

  const login = useCallback(
    async (
      payload: import("@services/auth/auth-service").LoginRequest,
    ): Promise<AuthError | UserError | null> => {
      const result = await authService.login(payload);
      if (!result.ok) {
        return result.error;
      }
      setHasToken(true);
      await queryClient.invalidateQueries({ queryKey: ["authNext", "me"] });
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
    setHasToken(false);
    queryClient.removeQueries({ queryKey: ["authNext", "me"] });
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(() => {
    const user = meQuery.data ?? null;
    const role = user?.role;
    const lastError = meQuery.error ?? null;
    const status: AuthStatus = hasToken === null
      ? "loading"
      : hasToken
        ? (user ? "authenticated" : "loading")
        : "unauthenticated";
    return {
      status,
      user,
      lastError,
      isAuthenticated: status === "authenticated",
      isLoading: status === "loading",
      isStaff: role === "STAFF",
      isCustomer: role === "USER",
      isSOS: role === "SOS",
      login,
      logout,
      hydrate,
    };
  }, [meQuery.data, meQuery.error, hasToken, login, logout, hydrate]);

  return <AuthContextNext.Provider value={value}>{children}</AuthContextNext.Provider>;
};

export function useAuthNext(): AuthContextValue {
  const ctx = useContext(AuthContextNext);
  if (!ctx) {
    throw new Error("useAuthNext must be used inside AuthProviderNext");
  }
  return ctx;
}

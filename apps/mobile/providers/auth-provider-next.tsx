import type { AuthError } from "@services/auth/auth-error";
import type { UserError } from "@services/users/user-error";

import { clearTokens, getAccessToken, getRefreshToken } from "@lib/auth-tokens";
import { log } from "@lib/log";
import { authService } from "@services/auth/auth-service";
import { userService } from "@services/users/user-service";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type UserDetail = import("@services/users/user-service").UserDetail;

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: UserDetail | null;
  lastError: UserError | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: import("@services/auth/auth-service").LoginRequest) => Promise<AuthError | UserError | null>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
};

const AuthContextNext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProviderNext: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<UserDetail | null>(null);
  const [lastError, setLastError] = useState<UserError | null>(null);

  const hydrate = useCallback(async () => {
    setStatus("loading");
    const accessToken = await getAccessToken();
    if (!accessToken) {
      setUser(null);
      setStatus("unauthenticated");
      return;
    }

    const meResult = await userService.me();
    if (!meResult.ok) {
      log.warn("AuthProviderNext hydrate failed", meResult.error);
      setLastError(meResult.error);
      setUser(null);

      if (meResult.error._tag === "ApiError" && meResult.error.code === "UNAUTHORIZED") {
        await clearTokens();
      }

      setStatus("unauthenticated");
      return;
    }

    setUser(meResult.value);
    setLastError(null);
    setStatus("authenticated");
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const login = useCallback(
    async (
      payload: import("@services/auth/auth-service").LoginRequest,
    ): Promise<AuthError | UserError | null> => {
      setStatus("loading");
      const result = await authService.login(payload);
      if (!result.ok) {
        setUser(null);
        setStatus("unauthenticated");
        return result.error;
      }

      const meResult = await userService.me();
      if (!meResult.ok) {
        log.warn("AuthProviderNext login: failed to fetch profile", meResult.error);
        setLastError(meResult.error);
        setUser(null);
        setStatus("unauthenticated");
        return meResult.error;
      }

      setUser(meResult.value);
      setLastError(null);
      setStatus("authenticated");
      return null;
    },
    [],
  );

  const logout = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      await authService.logout({ refreshToken });
    }
    await clearTokens();
    setUser(null);
    setLastError(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      status,
      user,
      lastError,
      isAuthenticated: status === "authenticated",
      isLoading: status === "loading",
      login,
      logout,
      hydrate,
    };
  }, [status, user, lastError, login, logout, hydrate]);

  return <AuthContextNext.Provider value={value}>{children}</AuthContextNext.Provider>;
};

export function useAuthNext(): AuthContextValue {
  const ctx = useContext(AuthContextNext);
  if (!ctx) {
    throw new Error("useAuthNext must be used inside AuthProviderNext");
  }
  return ctx;
}

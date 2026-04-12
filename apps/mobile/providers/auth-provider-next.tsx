import type { AuthError } from "@services/auth/auth-error";
import type { UserError } from "@services/users/user-error";

import { authQueryKeys } from "@hooks/query/auth-next/auth-query-keys";
import { useMeQuery } from "@hooks/query/auth-next/use-me-query";
import { clearTokens, getAccessToken, getRefreshToken } from "@lib/auth-tokens";
import { log } from "@lib/log";
import { clearPushToken, getPushToken } from "@lib/push-token";
import { authService } from "@services/auth/auth-service";
import { isUserApiError } from "@services/users/user-error";
import { userService } from "@services/users/user-service";
import { useQueryClient } from "@tanstack/react-query";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type UserDetail = import("@services/users/user-service").UserDetail;

type AuthStatus = "loading" | "authenticated" | "unauthenticated";
type TokenState = "checking" | "missing" | "present";

function deriveAuthStatus({
  tokenState,
  user,
  isMePending,
}: {
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

  const meQuery = useMeQuery(tokenState === "present");

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
    const currentPushToken = await getPushToken();
    if (currentPushToken) {
      const unregister = await userService.unregisterPushToken(currentPushToken);
      if (!unregister.ok) {
        log.warn("Failed to unregister current push token on logout", unregister.error);
      }
    }

    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      await authService.logout({ refreshToken });
    }
    await clearTokens();
    await clearPushToken();
    setTokenState("missing");
    queryClient.removeQueries({ queryKey: authQueryKeys.me() });
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(() => {
    const user = meQuery.data ?? null;
    const role = user?.role;
    const isStaff = role === "STAFF";
    const isTechnician = role === "TECHNICIAN";
    const lastError = meQuery.error ?? null;
    const status = deriveAuthStatus({
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
  }, [meQuery.data, meQuery.error, meQuery.isPending, tokenState, login, logout, hydrate]);

  return <AuthContextNext.Provider value={value}>{children}</AuthContextNext.Provider>;
};

export function useAuthNext(): AuthContextValue {
  const ctx = useContext(AuthContextNext);
  if (!ctx) {
    throw new Error("useAuthNext must be used inside AuthProviderNext");
  }
  return ctx;
}

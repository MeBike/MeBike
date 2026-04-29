import type { AuthError } from "@services/auth/auth-error";
import type { UserError } from "@services/users/user-error";

import { authQueryKeys } from "@hooks/query/auth-next/auth-query-keys";
import { useMeQuery } from "@hooks/query/auth-next/use-me-query";
import { clearTokens, getAccessToken, getRefreshToken } from "@lib/auth-tokens";
import { log } from "@lib/log";
import { authService } from "@services/auth/auth-service";
import { userService } from "@services/users/user-service";
import { isUserApiError } from "@services/users/user-error";
import { useQueryClient } from "@tanstack/react-query";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type UserDetail = import("@services/users/user-service").UserDetail;

type AuthStatus = "loading" | "authenticated" | "unauthenticated";
type TokenState = "checking" | "missing" | "present";

const AUTH_BOOTSTRAP_TIMEOUT_MS = 10000;

class AuthBootstrapTimeoutError extends Error {
  constructor() {
    super("Auth token check timed out");
    this.name = "AuthBootstrapTimeoutError";
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new AuthBootstrapTimeoutError());
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

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

function clearSessionQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.clear();
}

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
    withTimeout(getAccessToken(), AUTH_BOOTSTRAP_TIMEOUT_MS)
      .then((token) => {
        if (!active) {
          return;
        }
        setTokenState(token ? "present" : "missing");
      })
      .catch((err) => {
        log.warn("AuthProviderNext token check failed", err instanceof Error ? err.message : err);
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
        clearSessionQueries(queryClient);
      });
    }
  }, [meQuery.error, queryClient, tokenState]);

  const hydrate = useCallback(async () => {
    const token = await getAccessToken();
    const nextTokenState = token ? "present" : "missing";

    if (nextTokenState === "missing") {
      setSessionUser(null);
      setTokenState("missing");
      clearSessionQueries(queryClient);
      return;
    }

    const meResult = await userService.me();
    if (meResult.ok) {
      setSessionUser(meResult.value);
      queryClient.setQueryData(authQueryKeys.me(), meResult.value);
      setTokenState("present");
      return;
    }

    if (isUserApiError(meResult.error) && (meResult.error.code === "UNAUTHORIZED" || meResult.error.code === "FORBIDDEN")) {
      await clearTokens();
      setSessionUser(null);
      setTokenState("missing");
      clearSessionQueries(queryClient);
      return;
    }

    setTokenState("present");
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
      await hydrate();
      return null;
    },
    [hydrate],
  );

  const logout = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      await authService.logout({ refreshToken });
    }
    await clearTokens();
    setSessionUser(null);
    setTokenState("missing");
    clearSessionQueries(queryClient);
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

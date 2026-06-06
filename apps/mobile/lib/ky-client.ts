import type { Options } from "ky";

import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "@lib/auth-tokens";
import { log } from "@lib/log";
import { routePath, ServerRoutes } from "@lib/server-routes";
import { StatusCodes } from "http-status-codes";
import ky from "ky";

import { API_BASE_URL } from "@/lib/api-base-url";

type KyRequestOptions = Options & {
  skipAuth?: boolean;
};

type RefreshEnvelope = {
  data?: {
    accessToken?: string;
    refreshToken?: string;
  };
};

const SLOW_API_REQUEST_MS = 1000;

let refreshPromise: Promise<string | null> | null = null;

const nativeFetch = globalThis.fetch.bind(globalThis) as typeof fetch;

function getRequestMethod(input: RequestInfo | URL, init?: RequestInit) {
  if (init?.method) {
    return init.method.toUpperCase();
  }

  if (input instanceof Request) {
    return input.method.toUpperCase();
  }

  return "GET";
}

function getRequestUrl(input: RequestInfo | URL) {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

const timedFetch: typeof fetch = async (input, init) => {
  const startedAt = Date.now();
  const method = getRequestMethod(input, init);
  const url = getRequestUrl(input);

  try {
    const response = await nativeFetch(input, init);
    const durationMs = Date.now() - startedAt;
    const payload = {
      method,
      url,
      status: response.status,
      durationMs,
    };

    log.debug("API request completed", payload);

    if (durationMs >= SLOW_API_REQUEST_MS) {
      log.warn("Slow API request", payload);
    }

    return response;
  }
  catch (error) {
    const durationMs = Date.now() - startedAt;
    log.warn("API request failed", {
      method,
      url,
      durationMs,
      error: error instanceof Error
        ? {
            name: error.name,
            message: error.message,
          }
        : String(error),
    });
    throw error;
  }
};

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    await clearTokens();
    return null;
  }

  try {
    const response = await timedFetch(`${API_BASE_URL}/${routePath(ServerRoutes.auth.refresh)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.status !== StatusCodes.OK) {
      await clearTokens();
      return null;
    }

    const data = (await response.json()) as RefreshEnvelope;
    const accessToken = data.data?.accessToken;
    const nextRefresh = data.data?.refreshToken;

    if (!accessToken || !nextRefresh) {
      await clearTokens();
      return null;
    }

    await setTokens(accessToken, nextRefresh);
    return accessToken;
  }
  catch {
    await clearTokens();
    return null;
  }
}

export const kyClient = ky.create({
  prefixUrl: API_BASE_URL,
  timeout: 30000,
  retry: { limit: 0 },
  fetch: timedFetch,
  hooks: {
    beforeRequest: [
      async (request, options) => {
        const { skipAuth } = options as KyRequestOptions;
        if (skipAuth) {
          return;
        }

        const token = await getAccessToken();
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      async (request, options, response, state) => {
        const { skipAuth } = options as KyRequestOptions;
        if (skipAuth || response.status !== StatusCodes.UNAUTHORIZED) {
          return response;
        }

        if (state.retryCount > 0) {
          return response;
        }

        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }

        const newToken = await refreshPromise;
        if (!newToken) {
          return response;
        }

        const headers = new Headers(request.headers);
        headers.set("Authorization", `Bearer ${newToken}`);

        return ky.retry({
          request: new Request(request, { headers }),
          code: "TOKEN_REFRESHED",
        });
      },
    ],
  },
});

export async function kyJson<T>(url: string, options?: KyRequestOptions): Promise<T> {
  return kyClient(url, options).json<T>();
}

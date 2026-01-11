import type { Options } from "ky";

import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "@lib/auth-tokens";
import { routePath, ServerRoutes } from "@lib/server-routes";
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

const HTTP_STATUS = {
  OK: 200,
  UNAUTHORIZED: 401,
};

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    await clearTokens();
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/${routePath(ServerRoutes.auth.refresh)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (response.status !== HTTP_STATUS.OK) {
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
        if (skipAuth || response.status !== HTTP_STATUS.UNAUTHORIZED) {
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

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import {
  clearTokens,
  setTokens,
  getAccessToken,
  getRefreshToken,
} from "@utils/tokenManager";
import type { RefreshTokenResponse } from "@/types/auth.type";
import { REFRESH_TOKEN_MUTATION } from "@/graphql";
import { print } from "graphql";

export const HTTP_STATUS = {
  OK: 200,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export class FetchHttpClient {
  private baseURL: string;
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: void | PromiseLike<void>) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
      },
      timeout: 30000,
      withCredentials: true,
    });


    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const access_token = getAccessToken();
        if (access_token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${access_token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };
        let isAuthRequest = false;
        if (originalRequest.data) {
          try {
            const payload =
              typeof originalRequest.data === "string"
                ? JSON.parse(originalRequest.data)
                : originalRequest.data;

            if (
              payload.query &&
              payload.query.includes("mutation RefreshToken")
            ) {
              isAuthRequest = true;
            }
            if (
              payload.query &&
              (payload.query.includes("mutation LoginUser") ||
                payload.query.includes("mutation RegisterUser") ||
                payload.query.includes("mutation RefreshToken"))
            ) {
              isAuthRequest = true;
            }
          } catch (e) {
          }
        }
        const noAuthRetryUrls = [
          "/users/verify-email",
          "/users/verify-forgot-password",
          "/users/reset-password",
          "/users/resend-verify-email",
          "/users/refresh-token",
          "/users/change-password",
        ];
        const isIgnoredUrl =
          originalRequest.url &&
          noAuthRetryUrls.some((url) => originalRequest.url?.includes(url));
        console.log("isAuthRequest", isAuthRequest);
        const shouldSkipTokenRefresh = isAuthRequest || isIgnoredUrl;
        if (
          error.response?.status === HTTP_STATUS.UNAUTHORIZED &&
          !shouldSkipTokenRefresh && 
          !originalRequest._retry
        ) {
          if (this.isRefreshing) {
            return new Promise<void>((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => {
                const newToken = getAccessToken();
                if (newToken) {
                  originalRequest.headers = originalRequest.headers || {};
                  originalRequest.headers.Authorization = `Bearer ${newToken}`;
                }
                return this.axiosInstance(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }
          originalRequest._retry = true;
          this.isRefreshing = true;
          try {
            await this.refreshAccessToken();
            const newToken = getAccessToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            this.processQueue(null);
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("auth:token_refreshed"));
            }
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError);

            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("auth:session_expired"));
            }
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;  
          }
        }
        return Promise.reject(error);
      }
    );
  }
  private async refreshAccessToken(): Promise<string> {
    const refreshToken = getRefreshToken();
    console.log("Refreshing token...");

    if (!refreshToken) {
      throw new Error("No refresh token available via Cookies");
    }

    try {
      const response = await this.mutation<RefreshTokenResponse>(
        print(REFRESH_TOKEN_MUTATION),
        { refreshToken: refreshToken }
      );

      if ((response.data as any).errors) {
        throw new Error("GraphQL Error during refresh");
      }

      const result = response.data.data?.RefreshToken?.data;
      if (!result || !result.accessToken) {
        throw new Error("Invalid response structure");
      }
      setTokens(result.accessToken, result.refreshToken);

      return result.accessToken;
    } catch (error) {
      console.error("Refresh token failed:", error);
      clearTokens();
      throw error;
    }
  }

  private processQueue(error: unknown) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(undefined);
      }
    });
    this.failedQueue = [];
  }

  // --- Các hàm wrapper giữ nguyên ---
  private async requestGraphql<T>(
    payload: { query: string; variables?: object },
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post("", payload, config);
  }
  async get<T>(
    url: string,
    params?: AxiosRequestConfig["params"]
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get(url, { params: params ? { ...params } : {} });
  }
  async post<T>(
    url: string,
    data?: AxiosRequestConfig["data"],
    config?: AxiosRequestConfig<unknown>
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post(url, data, config);
  }
  async put<T>(
    url: string,
    data?: AxiosRequestConfig["data"],
    config?: AxiosRequestConfig<unknown>
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put(url, data, config);
  }
  async patch<T>(
    url: string,
    data?: AxiosRequestConfig["data"],
    config?: AxiosRequestConfig<unknown>
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.patch(url, data, config);
  }
  async delete<T>(
    url: string,
    params?: AxiosRequestConfig["params"]
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete(url, {
      params: params ? { ...params } : undefined,
    });
  }
  async query<T>(
    queryString: string,
    variables: object = {},
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.requestGraphql<T>({ query: queryString, variables }, config);
  }
  async mutation<T>(
    mutationString: string,
    variables: object = {},
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.requestGraphql<T>({ query: mutationString, variables }, config);
  }
}

const fetchHttpClient = new FetchHttpClient(
  process.env.NEXT_PUBLIC_API_BASE_URL || ""
);

export default fetchHttpClient;

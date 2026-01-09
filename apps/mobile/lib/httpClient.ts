import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@utils/tokenManager";
import axios from "axios";
import { print } from "graphql";
import { Platform } from "react-native";
import { REFRESH_TOKEN_MUTATION } from "@graphql";

// Constants
export const HTTP_STATUS = {
  OK: 200,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

const NO_RETRY_URLS = [
  "/users/verify-email",
  "/users/verify-forgot-password",
  "/users/reset-password",
  "/users/resend-verify-email",
  "/users/refresh-token",
  "/users/change-password",
];

type QueueItem = {
  resolve: (value: unknown) => void;
  reject: (error: AxiosError | null) => void;
};

export class HttpClient {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: QueueItem[] = [];

  constructor(private baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
      },
      timeout: 30000,
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.axiosInstance.interceptors.request.use(
      this.handleRequest,
      error => Promise.reject(error),
    );
    this.axiosInstance.interceptors.response.use(
      this.handleResponseSuccess,
      this.handleResponseError,
    );
  }

  private handleRequest = (
    config: InternalAxiosRequestConfig,
  ): InternalAxiosRequestConfig => {
    const accessToken = getAccessToken();
    const isRefreshTokenRequest = this.checkIsRefreshTokenRequest(config);
    if (accessToken && !isRefreshTokenRequest) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  };

  private handleResponseSuccess = (response: AxiosResponse) => {
    return response;
  };

  private handleResponseError = async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (
      !originalRequest
      || originalRequest._retry
      || this.shouldSkipTokenRefresh(originalRequest)
      || error.response?.status !== 401
    ) {
      return Promise.reject(error);
    }
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return this.axiosInstance(originalRequest);
        })
        .catch(err => Promise.reject(err));
    }
    originalRequest._retry = true;
    this.isRefreshing = true;
    try {
      const newToken = await this.refreshAccessToken();
      this.processQueue(null, newToken);
      this.dispatchAuthEvent("auth:token_refreshed");
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return this.axiosInstance(originalRequest);
    }
    catch (refreshError) {
      this.processQueue(refreshError as AxiosError, null);
      this.dispatchAuthEvent("auth:session_expired");
      return Promise.reject(refreshError);
    }
    finally {
      this.isRefreshing = false;
    }
  };

  private checkIsRefreshTokenRequest(config: InternalAxiosRequestConfig): boolean {
    if (!config.data)
      return false;
    try {
      const payload = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
      return payload.query && payload.query.includes("mutation RefreshToken");
    }
    catch {
      return false;
    }
  }

  private shouldSkipTokenRefresh(config: InternalAxiosRequestConfig): boolean {
    if (this.checkIsAuthRequest(config))
      return true;
    if (config.url && NO_RETRY_URLS.some(url => config.url?.includes(url))) {
      return true;
    }

    return false;
  }

  private checkIsAuthRequest(config: InternalAxiosRequestConfig): boolean {
    if (!config.data)
      return false;
    try {
      const payload = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
      return (
        payload.query
        && (payload.query.includes("mutation LoginUser")
          || payload.query.includes("mutation RegisterUser"))
      );
    }
    catch {
      return false;
    }
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }
    try {
      const payload = {
        query: print(REFRESH_TOKEN_MUTATION),
        variables: {},
      };
      const response = await this.axiosInstance.post("", payload);
      if (response.data.errors) {
        throw new Error("GraphQL Error during refresh");
      }
      const result = response.data.data?.RefreshToken?.data;
      if (!result?.accessToken || !result?.refreshToken) {
        throw new Error("Invalid refresh response structure");
      }
      setTokens(result.accessToken, result.refreshToken);
      return result.accessToken;
    }
    catch (error) {
      clearTokens();
      throw error;
    }
  }

  private processQueue(error: AxiosError | null, token: string | null = null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      }
      else {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  private dispatchAuthEvent(eventName: string) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(eventName));
    }
  }

  // --- Public API ---

  async get<T>(url: string, params?: AxiosRequestConfig["params"]): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get(url, { params });
  }

  async post<T>(
    url: string,
    data?: AxiosRequestConfig["data"],
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post(url, data, config);
  }

  async put<T>(
    url: string,
    data?: AxiosRequestConfig["data"],
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put(url, data, config);
  }

  async patch<T>(
    url: string,
    data?: AxiosRequestConfig["data"],
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.patch(url, data, config);
  }

  async delete<T>(url: string, params?: AxiosRequestConfig["params"]): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete(url, { params });
  }

  async query<T>(
    queryString: string,
    variables: object = {},
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post("", { query: queryString, variables }, config);
  }

  async mutation<T>(
    mutationString: string,
    variables: object = {},
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.query<T>(mutationString, variables, config);
  }
}
function getBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    console.log(
      `Using API Base URL from environment: ${process.env.EXPO_PUBLIC_API_BASE_URL}`,
    );
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  if (Platform.OS === "android") {
    const androidUrl = "http://10.0.2.2:4000";
    console.log(`Development on Android, using: ${androidUrl}`);
    return androidUrl;
  }
  else {
    const iosUrl = "http://localhost:4000";
    console.log(`Development on iOS/Web, using: ${iosUrl}`);
    return iosUrl;
  }
}

export const API_BASE_URL = getBaseUrl();
const httpClient = new HttpClient(API_BASE_URL);

export default httpClient;

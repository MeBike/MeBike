import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@lib/auth-tokens";
import axios from "axios";
import { Platform } from "react-native";

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
    resolve: (value: string | null) => void;
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
    });
    this.axiosInstance.interceptors.request.use(async (config) => {
      const access_token = await getAccessToken();
      if (access_token && !config.headers?.Authorization) {
        config.headers.Authorization = `Bearer ${access_token}`;
      }
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log("API Response:", response.status, response.config.url);
        return response;
      },
        async (error) => {
        console.log(
          "API Error:",
          error.response?.status,
          error.config?.url,
          error.response?.data,
        );
        const originalRequest = error.config;

        const shouldSkipTokenRefresh = typeof originalRequest?.url === "string"
          && originalRequest.url.includes("/v1/auth/");

        if (
          error.response?.status === HTTP_STATUS.UNAUTHORIZED &&
          !shouldSkipTokenRefresh
        ) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                if (token && originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return this.axiosInstance(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          this.isRefreshing = true;
          try {
            const newToken = await this.refreshAccessToken();
            this.processQueue(null, newToken);
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.axiosInstance(originalRequest);
          }
          catch (refreshError) {
            this.processQueue(refreshError, null);
            return Promise.reject(refreshError);
          }
          finally {
            this.isRefreshing = false;
          }
        }
        // switch (error.response?.status) {
        //   case HTTP_STATUS.FORBIDDEN:
        //     console.log("API: 403 Forbidden");
        //     window.location.href = `/error/${HTTP_STATUS.FORBIDDEN}`;
        //     break;
        //   case HTTP_STATUS.NOT_FOUND:
        //     console.log("API: 404 Not Found");
        //     break;
        //   // case HTTP_STATUS.INTERNAL_SERVER_ERROR:
        //   //   console.log("API: 500 Internal Server Error");
        //   //   window.location.href = `/error/${HTTP_STATUS.INTERNAL_SERVER_ERROR}`;
        //   //   break;
        //   case HTTP_STATUS.SERVICE_UNAVAILABLE:
        //     console.log("API: 503 Service Unavailable");
        //     window.location.href = `/error/${HTTP_STATUS.SERVICE_UNAVAILABLE}`;
        //     break;
        //   default:
        //     console.error(`API Error: ${error.response?.status}`);
        // }

        return Promise.reject(error);
      },
    );
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = await getRefreshToken();
    console.log("Refreshing token with:", refreshToken);
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }
    const response = await axios.post(
      `${this.baseURL}/v1/auth/refresh`,
      { refreshToken },
      { headers: { "Content-Type": "application/json" } },
    );
    console.log("Refresh token response:", response.status, response.data);
    if (response.status !== HTTP_STATUS.OK) {
      clearTokens();
      // Remove window.location.href as it's not available in React Native
      // You should handle navigation using React Navigation instead
      throw new Error("Refresh token expired");
    }
    const data = response.data as { data?: { accessToken?: string; refreshToken?: string } };
    const accessToken = data.data?.accessToken;
    const nextRefreshToken = data.data?.refreshToken;
    if (!accessToken || !nextRefreshToken) {
      await clearTokens();
      throw new Error("Invalid refresh response");
    }
    await setTokens(accessToken, nextRefreshToken);
    return accessToken;
  }

  private processQueue(error: unknown, token: string | null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      }
      else {
        resolve(token);
      }
    });
    this.failedQueue = [];
  }

  async get<T>(
    url: string,
    params?: AxiosRequestConfig["params"],
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get(url, {
      params: params ?? {},
    });
  }

  async post<T>(
    url: string,
    data?: AxiosRequestConfig["data"],
    config?: AxiosRequestConfig<unknown> | undefined,
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post(url, data, config);
  }

  // axios.put(url[, data[, config]])
  async put<T>(
    url: string,
    data?: AxiosRequestConfig["data"],
    config?: AxiosRequestConfig<unknown> | undefined,
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put(url, data, config);
  }

  // axios.patch(url[, data[, config]])
  async patch<T>(
    url: string,
    data?: AxiosRequestConfig["data"],
    config?: AxiosRequestConfig<unknown> | undefined,
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.patch(url, data, config);
  }

  // axios.delete(url[, config])
  async delete<T>(
    url: string,
    params?: AxiosRequestConfig["params"],
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete(url, {
      params,
    });
  }
}

function getBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    console.log(`Using API Base URL from environment: ${process.env.EXPO_PUBLIC_API_BASE_URL}`);
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

const fetchHttpClient = new FetchHttpClient(API_BASE_URL);
export default fetchHttpClient;

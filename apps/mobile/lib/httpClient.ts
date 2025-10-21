import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@utils/tokenManager";
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
          error.response?.data
        );
        const originalRequest = error.config;
        if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
          // Inspect response data for a token expiration error
          const isTokenExpired =
            error.response?.data?.error === "token_expired" ||
            error.response?.data?.message === "Jwt expired"; // Adjust according to your backend

          if (isTokenExpired) {
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
            } catch (refreshError) {
              this.processQueue(refreshError, null);
              return Promise.reject(refreshError);
            } finally {
              this.isRefreshing = false;
            }
          } else {
            return Promise.reject(error);
          }
        }
        // Error handling for React Native
        // Use React Navigation or other navigation methods instead of window.locatio n
        switch (error.response?.status) {
          case HTTP_STATUS.FORBIDDEN:
            console.log("API: 403 Forbidden");
            // Handle navigation using React Navigation
            break;
          case HTTP_STATUS.NOT_FOUND:
            console.log("API: 404 Not Found");
            break;
          case HTTP_STATUS.SERVICE_UNAVAILABLE:
            console.log("API: 503 Service Unavailable");
            // Handle navigation using React Navigation
            break;
          default:
             console.log(`API Error: ${error.response?.status}`);
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = await getRefreshToken();
    console.log("Refreshing token with:", refreshToken);
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }
    const response = await axios.post(
      `${this.baseURL}/users/refresh-token`,
      { refresh_token: refreshToken },
      { headers: { "Content-Type": "application/json" } }
    );
    console.log("Refresh token response:", response.status, response.data);
    if (response.status !== HTTP_STATUS.OK) {
      clearTokens();
      // Remove window.location.href as it's not available in React Native
      // You should handle navigation using React Navigation instead
      throw new Error("Refresh token expired");
    }
    const data = response.data;
    await setTokens(data.result.access_token, data.result.refresh_token);
    return data.result.access_token;
  }

  private processQueue(error: unknown, token: string | null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    this.failedQueue = [];
  }

  async get<T>(
    url: string,
    params?: AxiosRequestConfig["params"]
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get(url, {
      params: params ?? {},
    });
  }

  async post<T>(
    url: string,
    data?: AxiosRequestConfig["data"],
    config?: AxiosRequestConfig<unknown> | undefined
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post(url, data, config);
  }
  //axios.put(url[, data[, config]])
  async put<T>(
    url: string,
    data?: AxiosRequestConfig["data"],
    config?: AxiosRequestConfig<unknown> | undefined
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put(url, data, config);
  }
  //axios.patch(url[, data[, config]])
  async patch<T>(
    url: string,
    data?: AxiosRequestConfig["data"],
    config?: AxiosRequestConfig<unknown> | undefined
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.patch(url, data, config);
  }
  //axios.delete(url[, config])
  async delete<T>(
    url: string,
    params?: AxiosRequestConfig["params"]
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete(url, {
      params,
    });
  }
}

const fetchHttpClient = new FetchHttpClient(
  (() => {
    const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
    const defaultUrl = "http://localhost:4000";
    console.log("Environment EXPO_PUBLIC_API_BASE_URL:", envUrl);
    console.log("Using API Base URL:", envUrl || defaultUrl);
    const computerIP = "http://192.168.12.101:4000";
    console.log("Using computer IP for device testing:", computerIP);
    return computerIP;
  })()
);
export default fetchHttpClient;

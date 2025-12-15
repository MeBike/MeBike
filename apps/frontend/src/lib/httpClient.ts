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

// Types
interface CustomAxiosError extends AxiosError {
  zresponse?: {
    data: any;
    status: number;
    statusText: string;
    headers: any;
    config: InternalAxiosRequestConfig;
  };
}

interface QueueItem {
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

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
      (error) => Promise.reject(error)
    );

    this.axiosInstance.interceptors.response.use(
      this.handleResponseSuccess,
      this.handleResponseError
    );
  }

  // --- Interceptors ---

  private handleRequest = (
    config: InternalAxiosRequestConfig
  ): InternalAxiosRequestConfig => {
    const accessToken = getAccessToken();
    const isRefreshTokenRequest = this.checkIsRefreshTokenRequest(config);
    if (accessToken && !isRefreshTokenRequest) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  };

  private handleResponseSuccess = (response: AxiosResponse): any => {
    const { data, status } = response;

    // Detect "Internal Payload Error" (GraphQL errors with 200 OK)
    if (
      status === HTTP_STATUS.OK &&
      data?.errors?.length > 0
    ) {
      const unauthorizedError = data.errors.find(
        (err: any) => err.statusCode === HTTP_STATUS.UNAUTHORIZED
      );

      if (unauthorizedError) {
        // Construct a CustomAxiosError to trigger the error interceptor
        const error = new AxiosError(
          "Unauthorized (Internal Payload Error)",
          "UNAUTHORIZED",
          response.config,
          response.request,
          response
        ) as CustomAxiosError;

        error.zresponse = {
          data: response.data,
          status: HTTP_STATUS.UNAUTHORIZED,
          statusText: "Unauthorized",
          headers: response.headers,
          config: response.config,
        };

        return this.handleResponseError(error);
      }
    }

    return response;
  };

  private handleResponseError = async (error: CustomAxiosError | any) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Determine if it's a 401 Unauthorized error
    const isUnauthorized =
      error.response?.status === HTTP_STATUS.UNAUTHORIZED ||
      error.zresponse?.status === HTTP_STATUS.UNAUTHORIZED;

    // Check if we should skip retry
    if (
      !isUnauthorized ||
      !originalRequest ||
      originalRequest._retry ||
      this.shouldSkipTokenRefresh(originalRequest)
    ) {
      // If it's a GraphQL error (zresponse), we might want to return the data instead of rejecting
      // depending on how the app handles it. For now, we propagate the error.
      return Promise.reject(error);
    }

    // --- Token Refresh Logic ---

    if (this.isRefreshing) {
      // If already refreshing, queue the request
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return this.axiosInstance(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    this.isRefreshing = true;

    try {
      const newToken = await this.refreshAccessToken();
      
      this.processQueue(null, newToken);
      this.dispatchAuthEvent("auth:token_refreshed");

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return this.axiosInstance(originalRequest);
    } catch (refreshError) {
      this.processQueue(refreshError, null);
      this.dispatchAuthEvent("auth:session_expired");
      return Promise.reject(refreshError);
    } finally {
      this.isRefreshing = false;
    }
  };

  // --- Helpers ---

  private checkIsRefreshTokenRequest(config: InternalAxiosRequestConfig): boolean {
    if (!config.data) return false;
    try {
      const payload = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
      return payload.query && payload.query.includes("mutation RefreshToken");
    } catch {
      return false;
    }
  }

  private shouldSkipTokenRefresh(config: InternalAxiosRequestConfig): boolean {
    // Check if it's an auth request (login/register)
    if (this.checkIsAuthRequest(config)) return true;

    // Check against ignored URLs
    if (config.url && NO_RETRY_URLS.some((url) => config.url?.includes(url))) {
      return true;
    }

    return false;
  }

  private checkIsAuthRequest(config: InternalAxiosRequestConfig): boolean {
    if (!config.data) return false;
    try {
      const payload = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
      return (
        payload.query &&
        (payload.query.includes("mutation LoginUser") ||
          payload.query.includes("mutation RegisterUser"))
      );
    } catch {
      return false;
    }
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      // FIX: Inject refresh_token into the body for backend middleware validation
      const payload = {
        query: print(REFRESH_TOKEN_MUTATION),
        variables: {},
        refresh_token: refreshToken, 
      };

      const response = await this.axiosInstance.post<any>("", payload);

      // Check for GraphQL errors in response
      if (response.data.errors) {
        throw new Error("GraphQL Error during refresh");
      }

      const result = response.data.data?.RefreshToken?.data;
      if (!result?.accessToken || !result?.refreshToken) {
        throw new Error("Invalid refresh response structure");
      }

      setTokens(result.accessToken, result.refreshToken);
      return result.accessToken;
    } catch (error) {
      clearTokens();
      throw error;
    }
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
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
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post(url, data, config);
  }

  async put<T>(
    url: string,
    data?: AxiosRequestConfig["data"],
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put(url, data, config);
  }

  async patch<T>(
    url: string,
    data?: AxiosRequestConfig["data"],
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.patch(url, data, config);
  }

  async delete<T>(url: string, params?: AxiosRequestConfig["params"]): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete(url, { params });
  }

  async query<T>(
    queryString: string,
    variables: object = {},
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post("", { query: queryString, variables }, config);
  }

  async mutation<T>(
    mutationString: string,
    variables: object = {},
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.query<T>(mutationString, variables, config);
  }
}

const httpClient = new HttpClient(process.env.NEXT_PUBLIC_API_BASE_URL || "");

export default httpClient;

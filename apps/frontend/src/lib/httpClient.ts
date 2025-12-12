import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import {clearTokens,getAccessToken,getRefreshToken,setTokens} from "@utils/tokenManager"
export const HTTP_STATUS = {
  OK: 200,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};
export interface GraphQLResponse<T> {
  data: T;
  success?: boolean;
  message?:string;
  errors?: { message: string; [key: string]: string }[];
  statusCode?:number;
}
const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_API_GRAPH_QL;
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
      timeout: 30000, // Tăng lên 30 giây để đủ thời gian cho email service
    });
    this.axiosInstance.interceptors.request.use((config) => {
      const access_token = getAccessToken();
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

        // Các endpoint không cần retry token refresh
        const noAuthRetryEndpoints = [
          "/users/verify-email",
          "/users/verify-forgot-password",
          "/users/reset-password",
          "/users/resend-verify-email",
          "/users/refresh-token",
          "/users/change-password",
        ];

        const shouldSkipTokenRefresh = noAuthRetryEndpoints.some((endpoint) =>
          originalRequest?.url?.includes(endpoint)
        );

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
            window.dispatchEvent(new Event("auth:token_refreshed"));
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            window.dispatchEvent(new Event("auth:session_expired"));
            return Promise.reject(refreshError);
          } finally {
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
      }
    );
  }
  private async refreshAccessToken(): Promise<string> {
    const refreshToken = getRefreshToken();
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
      throw new Error("Refresh token expired");
    }
    const data = response.data;
    setTokens(data.result.access_token, data.result.refresh_token);
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
  private async requestGraphql<T>(
    payload: { query: string; variables?: object },
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<GraphQLResponse<T>>> {
    return this.axiosInstance.post<GraphQLResponse<T>>(
      "",
      payload,
      config
    );
  }
  async get<T>(
    url: string,
    params?: AxiosRequestConfig["params"]
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get(url, {
      params: params ? { ...params } : {},
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
      params: params ? { ...params } : undefined,
    });
  }
  async query<T>(
    queryString: string,
    variables: object = {},
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<GraphQLResponse<T>>> {
    return this.requestGraphql<T>({ query: queryString, variables }, config);
  }
  async mutation<T>(
    mutationString: string,
    variables: object = {},
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<GraphQLResponse<T>>> {
    return this.requestGraphql<T>({ query: mutationString, variables }, config);
  }
}

const fetchHttpClient = new FetchHttpClient(
  process.env.NEXT_PUBLIC_API_BASE_URL || ""
);

export default fetchHttpClient;

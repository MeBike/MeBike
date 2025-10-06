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

export class FetchHttpClient {
  private baseURL: string;
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: string | null) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
      },
       timeout: 5000,
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
         return response;
      },
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
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
        }

        switch (error.response?.status) {
          case HTTP_STATUS.FORBIDDEN:
            console.log("API: 403 Forbidden");
            window.location.href = `/error/${HTTP_STATUS.FORBIDDEN}`;
            break;
          case HTTP_STATUS.NOT_FOUND:
            console.log("API: 404 Not Found");
            break;
          case HTTP_STATUS.INTERNAL_SERVER_ERROR:
            console.log("API: 500 Internal Server Error");
            window.location.href = `/error/${HTTP_STATUS.INTERNAL_SERVER_ERROR}`;
            break;
          case HTTP_STATUS.SERVICE_UNAVAILABLE:
            console.log("API: 503 Service Unavailable");
            window.location.href = `/error/${HTTP_STATUS.SERVICE_UNAVAILABLE}`;
            break;
          default:
            console.error(`API Error: ${error.response?.status}`);
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }
    const response = await axios.post(
      `${this.baseURL}/auth/refresh`,
      { refresh_token: refreshToken },
      { headers: { "Content-Type": "application/json" } }
    );
    if (response.status !== HTTP_STATUS.OK) {
      clearTokens();
      window.location.href = "/login";
      throw new Error("Refresh token expired");
    }
    const data = response.data;
    setTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
    return data.access_token;
  }

  private processQueue(error: any, token: string | null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    this.failedQueue = [];
  }
 
   async get<T>(url: string, params?: AxiosRequestConfig["params"]): Promise<AxiosResponse<T>> {
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
  async delete<T>(url: string, params?: AxiosRequestConfig["params"]): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete(url, {
      params,
    });
  }
}

const fetchHttpClient = new FetchHttpClient(
  process.env.NEXT_PUBLIC_API_BASE_URL || ""
);

export default fetchHttpClient;

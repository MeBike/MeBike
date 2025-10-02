export const HTTP_STATUS = {
  OK: 200,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};
import { saveAuthData , clearAuthData , getAccessToken , refreshAccessToken} from "../../utils/auth";
export class FetchHttpClient {
  private baseURL: string;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: string | null) => void;
    reject: (reason: Error) => void;
  }> = [];
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private processQueue(error: Error | null, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  private async request<T>(
    url: string,
    options: RequestInit & { params?: Record<string, string> } = {}
  ): Promise<T> {
    let fullUrl = this.baseURL + url;
    if (options.params) {
      const query = new URLSearchParams(options.params).toString();
      fullUrl += `?${query}`;
    }
    const headers: Record<string, string> = {
      "Content-Type": "application/json;charset=UTF-8",
      ...(options.headers as Record<string, string> || {}),
    };

    const accessToken = getAccessToken();
    if (accessToken && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
      });
      if (response.status === HTTP_STATUS.UNAUTHORIZED) {
        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          }).then(async () => {
            const newToken = getAccessToken();
            if (newToken) {
              headers["Authorization"] = `Bearer ${newToken}`;
            }
            const res = await fetch(fullUrl, { ...options, headers });
            if (!res.ok) {
              throw new Error(`HTTP error ${res.status}`);
            }
            return await res.json();
          });
        }
        this.isRefreshing = true;
        try {
          const newToken = await refreshAccessToken(this.baseURL);
          this.processQueue(null, newToken);
          headers["Authorization"] = `Bearer ${newToken}`;
          const retryResponse = await fetch(fullUrl, {
            ...options,
            headers,
          });
          if (!retryResponse.ok) {
            throw new Error(`HTTP error ${retryResponse.status}`);
          }
          return (await retryResponse.json()) as T;
        } catch (refreshError) {
          this.processQueue(refreshError instanceof Error ? refreshError : new Error(String(refreshError)), null);
          throw refreshError;
        } finally {
          this.isRefreshing = false;
        }
      }
      if (!response.ok) {
        switch (response.status) {
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
            console.error(`API Error: ${response.status}`);
        }
        throw new Error(`HTTP error ${response.status}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      console.error("Network error:", error);
      throw error;
    }
  }

  get<T>(url: string, params?: Record<string, string>) {
    return this.request<T>(url, { method: "GET", params });
  }

  post<T>(url: string, data?: unknown) {
    return this.request<T>(url, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(url: string, data?: unknown) {
    return this.request<T>(url, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(url: string, data?: unknown) {
    return this.request<T>(url, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(url: string, params?: Record<string, string>) {
    return this.request<T>(url, { method: "DELETE", params });
  }
}

const fetchHttpClient = new FetchHttpClient(process.env.NEXT_PUBLIC_API_BASE_URL || "");

export default fetchHttpClient;

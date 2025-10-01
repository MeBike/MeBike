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
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }> = [];
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }
  private async refreshAccessToken(): Promise<string> {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }
    const response = await fetch(`${this.baseURL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
      throw new Error("Refresh token expired");
    }
    const data = await response.json();
    localStorage.setItem("access_token", data.access_token);
    if (data.refresh_token) {
      localStorage.setItem("refresh_token", data.refresh_token);
    }
    return data.access_token;
  }
  private processQueue(error: any, token: string | null = null) {
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
    // Build full URL
    let fullUrl = this.baseURL + url;
    if (options.params) {
      const query = new URLSearchParams(options.params).toString();
      fullUrl += `?${query}`;
    }

    // Add headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json;charset=UTF-8",
      ...(options.headers as Record<string, string> || {}),
    };

    const accessToken = localStorage.getItem("access_token");
    if (accessToken && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
      });
      if (response.status === HTTP_STATUS.UNAUTHORIZED) {
        // Nếu đang refresh token, thêm request vào queue
        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          }).then(() => {
            // Retry request với token mới
            const newToken = localStorage.getItem("access_token");
            if (newToken) {
              headers["Authorization"] = `Bearer ${newToken}`;
            }
            return fetch(fullUrl, { ...options, headers }).then(res => res.json());
          });
        }
        this.isRefreshing = true;
        try {
          const newToken = await this.refreshAccessToken();
          this.processQueue(null, newToken);
          // Retry request với token mới
          headers["Authorization"] = `Bearer ${newToken}`;
          const retryResponse = await fetch(fullUrl, {
            ...options,
            headers,
          });
          if (retryResponse.ok) {
            return (await retryResponse.json()) as T;
          }
        } catch (refreshError) {
          this.processQueue(refreshError, null);
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

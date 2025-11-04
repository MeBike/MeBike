import fetchHttpClient from "@lib/httpClient";
import { AxiosResponse } from "axios";

const DASHBOARD_BASE = "/dashboard";
const DASHBOARD_ENDPOINTS = {
  STATS: `${DASHBOARD_BASE}/stats`,
} as const;

interface DashboardStats {
  totalStations: number;
  totalBikes: number;
  totalUsers: number;
}

interface ApiResponse<T> {
  result?: T;
  message?: string;
}

export const dashboardService = {
  getDashboardStats: async (): Promise<AxiosResponse<ApiResponse<DashboardStats>>> => {
    const response = await fetchHttpClient.get<ApiResponse<DashboardStats>>(
      DASHBOARD_ENDPOINTS.STATS
    );
    return response;
  },
};
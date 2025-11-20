import fetchHttpClient from "@lib/httpClient";
import { AxiosResponse } from "axios";

const DASHBOARD_BASE = "/dashboard";
const DASHBOARD_ENDPOINTS = {
  STATS: `${DASHBOARD_BASE}/stats`,
  STATIONS: `${DASHBOARD_BASE}/stations`,
} as const;

interface DashboardStats {
  totalStations: number;
  totalBikes: number;
  totalUsers: number;
  appRating: {
    average_rating: number;
    total_ratings: number;
    five_star_count: number;
    four_star_count: number;
    three_star_count: number;
    two_star_count: number;
    one_star_count: number;
  };
}

interface StationData {
  name: string;
  address: string;
  availableBikes: number;
  average_rating?: number;
  total_ratings?: number;
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

  getStations: async (): Promise<AxiosResponse<ApiResponse<StationData[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<StationData[]>>(
      DASHBOARD_ENDPOINTS.STATIONS
    );
    return response;
  },
};
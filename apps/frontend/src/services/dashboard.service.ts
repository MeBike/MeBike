import fetchHttpClient from "@lib/httpClient";
import { AxiosResponse } from "axios";
import { DashboardStats, StationData } from "@custom-types";
import {ENDPOINT} from "@/constants/end-point";
const DASHBOARD_BASE = "/dashboard";
const DASHBOARD_ENDPOINTS = {
  STATS: `${DASHBOARD_BASE}/stats`,
  STATIONS: `${DASHBOARD_BASE}/stations`,
} as const;
interface ApiResponse<T> {
  result?: T;
  message?: string;
}

export const dashboardService = {
  getDashboardStats: async (): Promise<AxiosResponse<DashboardStats>> => {
    const response = await fetchHttpClient.get<DashboardStats>(
    ENDPOINT.DASHBOARD.STATS
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
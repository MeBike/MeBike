import fetchHttpClient from "@lib/httpClient";
import { AxiosResponse } from "axios";
import { DashboardStats, Station , ApiResponse } from "@custom-types";
import {ENDPOINT} from "@/constants/end-point";
const DASHBOARD_BASE = "/dashboard";
const DASHBOARD_ENDPOINTS = {
  STATS: `${DASHBOARD_BASE}/stats`,
  STATIONS: `/stations`,
} as const;

export const dashboardService = {
  getDashboardStats: async (): Promise<AxiosResponse<DashboardStats>> => {
    const response = await fetchHttpClient.get<DashboardStats>(
    ENDPOINT.DASHBOARD.STATS
    );
    return response;
  },
  getStations: async (): Promise<AxiosResponse<ApiResponse<Station[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Station[]>>(
      DASHBOARD_ENDPOINTS.STATIONS
    );
    return response;
  },
};
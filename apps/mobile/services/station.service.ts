import type { AxiosResponse } from "axios";

import fetchHttpClient from "@lib/httpClient";

import type { StationType } from "../types/StationType";

const STATION_BASE = "/stations";
const STATION_ENDPOINTS = {
  BASE: STATION_BASE,
  ALL: `${STATION_BASE}`,
  DETAIL: (id: string) => `${STATION_BASE}/${id}`,
//   STATS: `${STATION_BASE}/stats`,
//   BY_ID: (id: string) => `${BIKE_BASE}/${id}/rentals`,
//   BY_ID_ADMIN_STATS: (id: string) => `${BIKE_BASE}/${id}/stats`,
//   BY_ID_FOR_ALL: (id: string) => `${BIKE_BASE}/${id}`,
//   REPORT_BROKEN: (id: string) => `${BIKE_BASE}/report-broken/${id}`,
//   DELETE: (id: string) => `${BIKE_BASE}/${id}`,
//   UPDATE: (id: string) => `${BIKE_BASE}/admin-update/${id}`,
} as const;
type ApiResponse<T> = {
  data: T;
  pagination?: {
    limit: number;
    currentPage: number;
    totalPages: number;
    totalRecords: number;
  };
};
type ApiDetailResponse<T> = {
  result: T;
  message: string;
};

export const stationService = {
  getAllStations: async (): Promise<AxiosResponse<ApiResponse<StationType[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<StationType[]>>(
      STATION_ENDPOINTS.ALL,
    );
    return response;
  },
  getStationById: async (
    stationId: string,
  ): Promise<AxiosResponse<ApiDetailResponse<StationType>>> => {
    const response = await fetchHttpClient.get<ApiDetailResponse<StationType>>(
      STATION_ENDPOINTS.DETAIL(stationId),
    );
    return response;
  },
};

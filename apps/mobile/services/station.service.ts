import type { AxiosResponse } from "axios";

import fetchHttpClient from "@lib/httpClient";

import type { Station, StationType } from "../types/StationType";

const STATION_BASE = "/stations";
const STATION_ENDPOINTS = {
   BASE: STATION_BASE,
   ALL: `${STATION_BASE}?limit=30`,
   DETAIL: (id: string) => `${STATION_BASE}/${id}`,
   NEAR_ME: (lat: number, lng: number) =>
     `${STATION_BASE}/nearby?limit=30`,
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
  getNearMe: async (
    latitude: number,
    longitude: number,
  ): Promise<AxiosResponse<ApiResponse<Station[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Station[]>>(
      STATION_ENDPOINTS.NEAR_ME(latitude, longitude),
      {
        latitude,
        longitude,
      },
    );
    return response;
  },
};

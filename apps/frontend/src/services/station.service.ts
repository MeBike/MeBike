import fetchHttpClient from "@lib/httpClient";
import { AxiosResponse } from "axios";
import { Station } from "@/types";
import { StationSchemaFormData } from "@/schemas/stationSchema";
import type {
  StationBikeRevenue,
  StationStatisticsResponse,
} from "@/types/Station";
const STATION_BASE = "/stations";
const STATION_ENDPOINTS = {
  BASE: STATION_BASE,
  ALL: `${STATION_BASE}`,
  DETAIL: (id: string) => `${STATION_BASE}/${id}`,
  ID: (id: string) => `${STATION_BASE}/${id}`,
  STATION_BIKE_REVENUE: () => `${STATION_BASE}/bike-revenue`,
  STATION_REVENUE : () => `${STATION_BASE}/revenue`,
  //   STATS: `${STATION_BASE}/stats`,
  //   BY_ID: (id: string) => `${BIKE_BASE}/${id}/rentals`,
  //   BY_ID_ADMIN_STATS: (id: string) => `${BIKE_BASE}/${id}/stats`,
  //   BY_ID_FOR_ALL: (id: string) => `${BIKE_BASE}/${id}`,
  //   REPORT_BROKEN: (id: string) => `${BIKE_BASE}/report-broken/${id}`,
  //   DELETE: (id: string) => `${BIKE_BASE}/${id}`,
  //   UPDATE: (id: string) => `${BIKE_BASE}/admin-update/${id}`,
} as const;
interface ApiResponse<T> {
  data: T;
  pagination?: {
    limit: number;
    currentPage: number;
    totalPages: number;
    totalRecords: number;
  };
}
interface ApiDetailResponse<T> {
  result?: T;
  message?: string;
}
interface DeleteResponse {
  message: string;
}
export const stationService = {
  getAllStations: async ({
    page,
    limit,
  }: {
    page?: number;
    limit?: number;
  }): Promise<AxiosResponse<ApiResponse<Station[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Station[]>>(
      STATION_ENDPOINTS.ALL,
      {
        page,
        limit,
      }
    );
    return response;
  },
  getStationById: async (
    stationId: string
  ): Promise<AxiosResponse<ApiDetailResponse<Station>>> => {
    const response = await fetchHttpClient.get<ApiDetailResponse<Station>>(
      STATION_ENDPOINTS.DETAIL(stationId)
    );
    return response;
  },
  createStation: async (
    stationData: StationSchemaFormData
  ): Promise<AxiosResponse<ApiDetailResponse<Station>>> => {
    const response = await fetchHttpClient.post<ApiDetailResponse<Station>>(
      STATION_ENDPOINTS.BASE,
      stationData
    );
    return response;
  },
  softDeleteStation: async ({
    stationID,
  }: {
    stationID: string;
  }): Promise<AxiosResponse<DeleteResponse>> => {
    const response = await fetchHttpClient.delete<DeleteResponse>(
      STATION_ENDPOINTS.ID(stationID)
    );
    return response;
  },
  updateStation: async ({
    stationID,
    stationData,
  }: {
    stationID: string;
    stationData: StationSchemaFormData;
  }): Promise<AxiosResponse<ApiDetailResponse<Station>>> => {
    const response = await fetchHttpClient.put<ApiDetailResponse<Station>>(
      STATION_ENDPOINTS.ID(stationID),
      stationData
    );
    return response;
  },
  getStationBikeRevenue: async (): Promise<
    AxiosResponse<ApiDetailResponse<StationBikeRevenue>>
  > => {
    const response = await fetchHttpClient.get<
      ApiDetailResponse<StationBikeRevenue>
    >(STATION_ENDPOINTS.STATION_BIKE_REVENUE());
    return response;
  },
  getStationRevenue: async (): Promise<
    AxiosResponse<ApiDetailResponse<StationStatisticsResponse>>
  > => {
    const response = await fetchHttpClient.get<
      ApiDetailResponse<StationStatisticsResponse>
    >(STATION_ENDPOINTS.STATION_REVENUE(), );
    return response;
  },
};

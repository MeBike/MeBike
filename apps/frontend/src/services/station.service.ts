import fetchHttpClient from "@lib/httpClient";
import { AxiosResponse } from "axios";
import { Station, NearestStationResponse } from "@/types";
import { StationSchemaFormData } from "@/schemas/stationSchema";
import {
  GetAllStationsResponse,
  GetDetailStationResponse,
  CreateStationResponse,
  UpdateStationStatusResponse,
} from "@/types/station.type";
import {
  GET_STATIONS,
  GET_DETAIL_STATION,
  CREATE_STATION,
  UPDATE_STATION,
  UPDATE_STATUS_STATION_STATUS,
} from "@/graphql";
import { print } from "graphql";
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
  STATION_REVENUE: () => `${STATION_BASE}/revenue`,
  STATION_NEAREST_AVAILABLE_BIKE: () =>
    `${STATION_BASE}/nearest-available-bike`,
  //   CREATE: `${STATION_BASE}`,
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
    name,
    latitude,
    longitude,
    search,
  }: {
    page?: number;
    limit?: number;
    name?: string;
    latitude?: string;
    longitude?: string;
    search?: string;
  }): Promise<AxiosResponse<GetAllStationsResponse>> => {
    const response = await fetchHttpClient.mutation<GetAllStationsResponse>(
      print(GET_STATIONS),
      {
        page,
        limit,
        name,
        latitude,
        longitude,
        search,
      }
    );
    return response;
  },
  getStationById: async (
    stationId: string
  ): Promise<AxiosResponse<GetDetailStationResponse>> => {
    const response = await fetchHttpClient.mutation<GetDetailStationResponse>(
      print(GET_DETAIL_STATION),
      {
        staionId: stationId,
      }
    );
    return response;
  },
  createStation: async (
    stationData: StationSchemaFormData
  ): Promise<AxiosResponse<CreateStationResponse>> => {
    const response = await fetchHttpClient.mutation<CreateStationResponse>(
      print(CREATE_STATION),
      {
        body: {
          address: stationData.address,
          capacity: stationData.capacity,
          latitude: stationData.latitude,
          longitude: stationData.longitude,
          name: stationData.name,
        },
      }
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
    >(STATION_ENDPOINTS.STATION_REVENUE());
    return response;
  },
  getStationNearestAvailableBike: async ({
    latitude,
    longitude,
    maxDistance,
  }: {
    latitude: number;
    longitude: number;
    maxDistance?: number;
  }): Promise<AxiosResponse<ApiDetailResponse<NearestStationResponse>>> => {
    const response = await fetchHttpClient.get<
      ApiDetailResponse<NearestStationResponse>
    >(STATION_ENDPOINTS.STATION_NEAREST_AVAILABLE_BIKE(), {
      latitude: latitude,
      longitude: longitude,
      maxDistance: maxDistance,
    });
    return response;
  },
  updateStationStatus: async ({
    id,
  }: {
    id: string;
  }): Promise<AxiosResponse<UpdateStationStatusResponse>> => {
    const response =
      await fetchHttpClient.mutation<UpdateStationStatusResponse>(
        print(UPDATE_STATUS_STATION_STATUS),
        {
          body: {
            id : id,
          },
        }
      );
    return response;
  },
};

import fetchHttpClient from "@lib/httpClient";
import { AxiosResponse } from "axios";
import { Station, NearestStationResponse} from "@/types";
import { StationSchemaFormData } from "@/schemas/station-schema";
import type {
  StationBikeRevenue,
  StationStatisticsResponse,
  CurrentStation,
  StaffReportRevenueResponse
} from "@/types/Station";
import { ENDPOINT } from "@/constants/end-point";
import { ApiResponse , DetailApiResponse } from "@/types";
export const stationService = {
  getAllStations: async ({
    page,
    pageSize,
    name,
    address,
    latitude,
    longitude,
    sortBy,
    sortDir,   
  }: {
    page?: number;
    pageSize?: number;
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    sortBy?: "name" | "capacity" | "updatedAt";
    sortDir?: "asc" | "desc";
  }): Promise<AxiosResponse<ApiResponse<Station[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Station[]>>(
      ENDPOINT.STATION.BASE,
      {
        page,
        pageSize,
        name,
        address,
        latitude,
        longitude,
        sortBy,
        sortDir,
      }
    );
    return response;
  },
  getListStations: async (): Promise<AxiosResponse<CurrentStation>> => {
    const response = await fetchHttpClient.get<CurrentStation>(
      ENDPOINT.STATION.CONTEXT_STATION
    );
    return response;
  },
  getMyStations : async ({
    page,
    pageSize,
    name,
    address,
    latitude,
    longitude,
    sortBy,
    sortDir,   
  }: {
    page?: number;
    pageSize?: number;
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    sortBy?: "name" | "capacity" | "updatedAt";
    sortDir?: "asc" | "desc";
  }): Promise<AxiosResponse<ApiResponse<Station[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Station[]>>(
      ENDPOINT.STAFF.STATION,
      {
        page,
        pageSize,
        name,
        address,
        latitude,
        longitude,
        sortBy,
        sortDir,
      }
    );
    return response;
  },
  getMyStationDetail: async (
    stationId: string
  ): Promise<AxiosResponse<Station>> => {
    const response = await fetchHttpClient.get<Station>(
      ENDPOINT.STAFF.STATION_DETAIL(stationId)
    );
    return response;
  },
  getSelectStations : async () : Promise<AxiosResponse<ApiResponse<Station[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Station[]>>(
      ENDPOINT.STATION.SELECT_STATION,
      {
        page : 1,
        pageSize : 200,
      }
    );
    return response;
  },
  getStationById: async (
    stationId: string
  ): Promise<AxiosResponse<Station>> => {
    const response = await fetchHttpClient.get<Station>(
      ENDPOINT.STATION.DETAIL(stationId)
    );
    return response;
  },
  createStation: async (
    stationData: StationSchemaFormData
  ): Promise<AxiosResponse<DetailApiResponse<Station>>> => {
    const response = await fetchHttpClient.post<DetailApiResponse<Station>>(
      ENDPOINT.STATION.BASE,
      stationData
    );
    return response;
  },
  softDeleteStation: async ({
    stationID,
  }: {
    stationID: string;
  }): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.delete(
      ENDPOINT.STATION.DETAIL(stationID)
    );
    return response;
  },
  updateStation: async ({
    stationID,
    stationData,
  }: {
    stationID: string;
    stationData: StationSchemaFormData;
  }): Promise<AxiosResponse<DetailApiResponse<Station>>> => {
    const response = await fetchHttpClient.patch<DetailApiResponse<Station>>(
      ENDPOINT.STATION.DETAIL(stationID),
      stationData
    );
    return response;
  },
  getStationBikeRevenue: async (): Promise<
    AxiosResponse<DetailApiResponse<StationBikeRevenue>>
  > => {
    const response = await fetchHttpClient.get<
      DetailApiResponse<StationBikeRevenue>
    >(ENDPOINT.STATION.STATION_BIKE_REVENUE());
    return response;
  },
  getStationRevenue: async (): Promise<
    AxiosResponse<StationBikeRevenue>> => {
    const response = await fetchHttpClient.get<
      StationBikeRevenue
    >(ENDPOINT.STATION.STATION_REVENUE());
    return response;
  },
  getStationRevenueForManager: async (): Promise<
    AxiosResponse<StaffReportRevenueResponse>> => {
    const response = await fetchHttpClient.get<
      StaffReportRevenueResponse
    >(ENDPOINT.STATION.MANAGER_STATION_REVENUE);
    return response;
  },
  getStationRevenueForAgency: async (): Promise<
    AxiosResponse<StaffReportRevenueResponse>> => {
    const response = await fetchHttpClient.get<
      StaffReportRevenueResponse
    >(ENDPOINT.STATION.AGENCY_STATION_REVENUE);
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
  }): Promise<AxiosResponse<DetailApiResponse<NearestStationResponse>>> => {
    const response = await fetchHttpClient.get<
      DetailApiResponse<NearestStationResponse>
    >(ENDPOINT.STATION.STATION_NEAREST_AVAILABLE_BIKE(), {
      latitude: latitude,
      longitude: longitude,
      maxDistance: maxDistance,
    });
    return response;
  },
};

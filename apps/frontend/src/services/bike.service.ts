import fetchHttpClient from "@/lib/httpClient";
import type { AxiosResponse } from "axios";
import type {
  BikeSchemaFormData,
  UpdateBikeSchemaFormData,
} from "@schemas/bikeSchema";
import { Bike } from "@custom-types";
import { BikeStatus } from "@custom-types";
interface ApiResponse<T> {
  data: T;
  pagination: {
    totalPages: number;
    currentPage: number;
    limit: number;
    totalRecords: number;
  };
  message: string;
}
interface DetailApiResponse<T> {
  result: T;
  message: string;
}
interface BikeStatistics {
  "ĐÃ ĐẶT TRƯỚC": number;
  "CÓ SẴN": number;
  "ĐANG ĐƯỢC THUÊ": number;
  "KHÔNG CÓ SẴN": number;
  "BỊ HỎNG": number;
}
const BIKE_BASE = "/bikes";
const BIKE_ENDPOINTS = {
  BASE: BIKE_BASE,
  STATS: `${BIKE_BASE}/stats`,
  BY_ID: (id: string) => `${BIKE_BASE}/${id}/rentals`,
  BY_ID_ADMIN_STATS: (id: string) => `${BIKE_BASE}/${id}/stats`,
  BY_ID_FOR_ALL: (id: string) => `${BIKE_BASE}/${id}`,
  REPORT_BROKEN: (id: string) => `${BIKE_BASE}/report-broken/${id}`,
  DELETE: (id: string) => `${BIKE_BASE}/${id}`,
  UPDATE: (id: string) => `${BIKE_BASE}/admin-update/${id}`,
} as const;
// interface ApiResponse<T> {
//   data: T;
//   message: string;
// }
export const bikeService = {
  //for admin

  createBikeAdmin: async (
    data: BikeSchemaFormData
  ): Promise<AxiosResponse<DetailApiResponse<Bike>>> => {
    const response = await fetchHttpClient.post<DetailApiResponse<Bike>>(
      BIKE_ENDPOINTS.BASE,
      data
    );
    return response;
  },
  getStatisticsBikeAdmin: async (): Promise<
    AxiosResponse<DetailApiResponse<BikeStatistics>>
  > => {
    const response = await fetchHttpClient.get<
      DetailApiResponse<BikeStatistics>
    >(BIKE_ENDPOINTS.STATS);
    return response;
  },
  getStatusBikeByIdAdmin: async (id: string): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.get(
      BIKE_ENDPOINTS.BY_ID_ADMIN_STATS(id)
    );
    return response;
  },
  deleteBike: async (id: string): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.delete(BIKE_ENDPOINTS.DELETE(id));
    return response;
  },

  //for both admin and staf
  getHistoryBikeById: async (id: string): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.get(BIKE_ENDPOINTS.BY_ID(id));
    return response;
  },
  updateBike: async (
    id: string,
    data: Partial<UpdateBikeSchemaFormData>
  ): Promise<AxiosResponse<DetailApiResponse<Bike>>> => {
    const response = await fetchHttpClient.patch<DetailApiResponse<Bike>>(
      BIKE_ENDPOINTS.UPDATE(id),
      data
    );
    return response;
  },
  //for user
  reportBrokenBike: async (id: string): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.patch(
      BIKE_ENDPOINTS.REPORT_BROKEN(id)
    );
    return response;
  },
  //all
  getBikeByIdForAll: async (id: string): Promise<AxiosResponse<DetailApiResponse<Bike>>> => {
    const response = await fetchHttpClient.get<DetailApiResponse<Bike>>(
      BIKE_ENDPOINTS.BY_ID_FOR_ALL(id)
    );
    return response;
  },
  getAllBikes: async ({
    page,
    limit,
    station_id,
    supplier_id,
    status,
  }: {
    page?: number;
    limit?: number;
    station_id?: string;
    supplier_id?: string;
    status?: BikeStatus;
  }): Promise<AxiosResponse<ApiResponse<Bike[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Bike[]>>(
      BIKE_ENDPOINTS.BASE,
      {
        page,
        limit,
        station_id,
        supplier_id,
        status,
      }
    );
    return response;
  },
};

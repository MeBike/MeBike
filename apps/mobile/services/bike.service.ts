import type { AxiosResponse } from "axios";

import type { Bike } from "../types/BikeTypes";

import fetchHttpClient from "../lib/httpClient";

type ApiReponse<T> = {
  data: T;
  pagination?: {
    totalPages: number;
    totalRecords: number;
    limit: number;
    currentPage: number;
  };
};
interface DetailApiResponse<T> {
  result: T;
  message: string;
}
const BIKE_BASE = "/bikes";
const BIKE_ENDPOINTS = {
  BASE: BIKE_BASE,
  BY_ID: (id: string) => `${BIKE_BASE}/${id}/rentals`,
  BY_ID_FOR_ALL: (id: string) => `${BIKE_BASE}/${id}`,
  REPORT_BROKEN: (id: string) => `${BIKE_BASE}/report-broken/${id}`,
} as const;
export type GetAllBikesQueryParams = {
  page: number;
  limit: number;
  station_id: string;
  supplier_id: string;
  status:
    | "CÓ SẴN"
    | "ĐANG ĐƯỢC THUÊ"
    | "BỊ HỎNG"
    | "ĐÃ ĐẶT TRƯỚC"
    | "ĐANG BẢO TRÌ"
    | "KHÔNG CÓ SẴN";
};
export const bikeService = {
   // for user
  reportBrokenBike: async (id: string): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.patch(
      BIKE_ENDPOINTS.REPORT_BROKEN(id)
    );
    return response;
  },
  // all
  getBikeByIdForAll: async (
    id: string
  ): Promise<AxiosResponse<DetailApiResponse<Bike>>> => {
    const response = await fetchHttpClient.get<DetailApiResponse<Bike>>(
      BIKE_ENDPOINTS.BY_ID_FOR_ALL(id)
    );
    return response;
  },
  getAllBikes: async (
    data: Partial<GetAllBikesQueryParams>
  ): Promise<AxiosResponse<ApiReponse<Bike[]>>> => {
    const response = await fetchHttpClient.get<ApiReponse<Bike[]>>(
      BIKE_ENDPOINTS.BASE,
      { ...data }
    );
    return response;
  },
};

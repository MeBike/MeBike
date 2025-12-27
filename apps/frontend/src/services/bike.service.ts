import fetchHttpClient from "@/lib/httpClient";
import type { AxiosResponse } from "axios";
import type {
  BikeSchemaFormData,
  UpdateBikeSchemaFormData,
} from "@schemas/bikeSchema";
import { Bike, BikeRentalHistory , DetailBike} from "@custom-types";
import { BikeStatus } from "@custom-types";
import { BikeActivityStats } from "@custom-types";
import { BikeStats } from "@custom-types";
import {
  GET_BIKES,
  GET_DETAIL_BIKES,
  CREATE_BIKE,
  UPDATE_BIKE,
  CHANGE_BIKE_STATUS,
} from "@/graphql";
import {
  CreateBikeResponse,
  GetBikesResponse,
  GetDetailBikeResponse,
  UpdateBikeResponse,
  ChangeBikeStatusResponse,
} from "@/types/bike.type";
import { print } from "graphql";
interface DetailApiResponse<T> {
  result: T;
  message: string;
}
interface DetailApiResponseCuaNguyen<T> {
  result: {
    data: T;
  };
  message: string;
}
export interface BikeStatistics {
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
  ACTIVIY_STATS: (id: string) => `${BIKE_BASE}/${id}/activity-stats`,
  STATS_BIKE: (id: string) => `${BIKE_BASE}/${id}/stats`,
  RENTAL_HISTORY_BIKE: (id: string) => `${BIKE_BASE}/${id}/rental-history`,
} as const;
// interface ApiResponse<T> {
//   data: T;
//   message: string;
// }
export const bikeService = {
  //for admin
  createBikeAdmin: async (
    data: BikeSchemaFormData
  ): Promise<AxiosResponse<CreateBikeResponse>> => {
    const response = await fetchHttpClient.mutation<CreateBikeResponse>(
      print(CREATE_BIKE),
      {
        body: {
          chipId: data.chip_id,
          supplierId: data.supplier_id,
          stationId: data.station_id,
        },
      }
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
    updateBikeId: string,
    data: Partial<UpdateBikeSchemaFormData>
  ): Promise<AxiosResponse<UpdateBikeResponse>> => {
    const response = await fetchHttpClient.mutation<UpdateBikeResponse>(
      print(UPDATE_BIKE),
      {
        body: {
          chipId: data.chip_id,
          supplierId: data.supplier_id,
          stationId: data.station_id,
        },
        updateBikeId: updateBikeId,
      }
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
  getAllBikes: async ({
    limit,
    page,
  }: {
    limit?: number;
    page?: number;
  }): Promise<AxiosResponse<GetBikesResponse>> => {
    const response = await fetchHttpClient.query<GetBikesResponse>(
      print(GET_BIKES),
      {
        params: {
          limit: limit ?? 10,
          page: page ?? 1,
        },
      }
    );
    return response;
  },
  getDetailBike: async (
    id: string
  ): Promise<AxiosResponse<GetDetailBikeResponse>> => {
    const response = await fetchHttpClient.query<GetDetailBikeResponse>(
      print(GET_DETAIL_BIKES),
      {
        bikeId: id,
      }
    );
    return response;
  },
  getBikeActivityStats: async (
    id: string
  ): Promise<AxiosResponse<DetailApiResponse<BikeActivityStats>>> => {
    const response = await fetchHttpClient.get<
      DetailApiResponse<BikeActivityStats>
    >(BIKE_ENDPOINTS.ACTIVIY_STATS(id));
    return response;
  },
  getStatisticsBike: async (
    id: string
  ): Promise<AxiosResponse<DetailApiResponse<BikeStats>>> => {
    const response = await fetchHttpClient.get<DetailApiResponse<BikeStats>>(
      BIKE_ENDPOINTS.STATS_BIKE(id)
    );
    return response;
  },
  getRentalHistoryBike: async (
    id: string
  ): Promise<AxiosResponse<DetailApiResponseCuaNguyen<BikeRentalHistory>>> => {
    const response = await fetchHttpClient.get<
      DetailApiResponseCuaNguyen<BikeRentalHistory>
    >(BIKE_ENDPOINTS.RENTAL_HISTORY_BIKE(id));
    return response;
  },
  changeStatusBike: async (
    changeBikeStatusId: string,
    status: BikeStatus
  ): Promise<AxiosResponse<ChangeBikeStatusResponse>> => {
    const response = await fetchHttpClient.mutation<ChangeBikeStatusResponse>(
      print(CHANGE_BIKE_STATUS),
      {
        changeBikeStatusId: changeBikeStatusId,
        status: status,
      }
    );
    return response;
  },
};

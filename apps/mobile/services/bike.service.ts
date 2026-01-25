import type { BikeGraphql } from "@lib/mappers/bike";
import type { AxiosResponse } from "axios";

import fetchHttpClient from "@lib/httpClient";
import { toBikeType } from "@lib/mappers/bike";
import { print } from "graphql";

import { GET_BIKES, GET_DETAIL_BIKES } from "@/graphql";

import type { Bike } from "../types/BikeTypes";

type ApiReponse<T> = {
  data: T;
  pagination?: {
    totalPages: number;
    totalRecords: number;
    limit: number;
    currentPage: number;
  };
};

type DetailApiResponse<T> = {
  result: T | null;
  message: string;
};

type BikesQueryResult = {
  data?: {
    Bikes?: {
      data?: BikeGraphql[];
      pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    };
  };
};

type BikeDetailQueryResult = {
  data?: {
    Bike?: {
      data?: BikeGraphql | null;
    };
  };
};

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
    const response = await fetchHttpClient.patch(`/bikes/report-broken/${id}`);
    return response;
  },
  // all
  getBikeByIdForAll: async (
    id: string,
  ): Promise<AxiosResponse<DetailApiResponse<Bike>>> => {
    const response = await fetchHttpClient.query<BikeDetailQueryResult>(
      print(GET_DETAIL_BIKES),
      {
        bikeId: id,
      },
    );
    const bike = response.data?.data?.Bike?.data ?? null;
    return {
      ...response,
      data: {
        result: bike ? toBikeType(bike) : null,
        message: bike ? "OK" : "Bike not found",
      },
    };
  },
  getAllBikes: async (
    data: Partial<GetAllBikesQueryParams>,
  ): Promise<AxiosResponse<ApiReponse<Bike[]>>> => {
    const search = data.station_id || data.supplier_id || "";
    const response = await fetchHttpClient.query<BikesQueryResult>(
      print(GET_BIKES),
      {
        params: {
          page: data.page ?? 1,
          limit: data.limit ?? 20,
          search,
        },
      },
    );
    const result = response.data?.data?.Bikes;
    const bikes = result?.data ?? [];
    const pagination = result?.pagination;

    return {
      ...response,
      data: {
        data: bikes.map(toBikeType),
        pagination: pagination
          ? {
              totalPages: pagination.totalPages,
              totalRecords: pagination.total,
              limit: pagination.limit,
              currentPage: pagination.page,
            }
          : undefined,
      },
    };
  },
};

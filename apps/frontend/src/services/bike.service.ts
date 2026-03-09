import fetchHttpClient from "@/lib/httpClient";
import type { AxiosResponse } from "axios";
import type {
  BikeSchemaFormData,
  UpdateBikeSchemaFormData,
} from "@schemas/bikeSchema";
import { BikeStats ,Bike , BikeRentalHistory , BikeStatus , BikeActivityStats , BikeStatistics } from "@custom-types";
import { ENDPOINT } from "@/constants/end-point";
import { ApiResponse } from "@custom-types";

export const bikeService = {
  //for admin

  createBikeAdmin: async (
    data: BikeSchemaFormData
  ): Promise<AxiosResponse<Bike>> => {
    const response = await fetchHttpClient.post<Bike>(
      ENDPOINT.BIKE.BASE,
      data
    );
    return response;
  },
  getStatisticsBikeAdmin: async (): Promise<
    AxiosResponse<BikeStatistics>
  > => {
    const response = await fetchHttpClient.get<
    BikeStatistics
    >(ENDPOINT.BIKE.STATS_SUMMARY);
    return response;
  },
  getStatusBikeByIdAdmin: async (id: string): Promise<AxiosResponse<BikeStatus>> => {
    const response = await fetchHttpClient.get<BikeStatus>(
      ENDPOINT.BIKE.ID(id)
    );
    return response;
  },
  deleteBike: async (id: string): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.delete(ENDPOINT.BIKE.ID(id));
    return response;
  },
  //for both admin and staf
  getHistoryBikeById: async (id: string): Promise<AxiosResponse<BikeRentalHistory>> => {
    const response = await fetchHttpClient.get<BikeRentalHistory>(
      ENDPOINT.BIKE.RENTAL_HISTORY(id)
    );
    return response;
  },
  updateBike: async (
    id: string,
    data: Partial<UpdateBikeSchemaFormData>
  ): Promise<AxiosResponse<Bike>> => {
    const response = await fetchHttpClient.patch<Bike>(
      ENDPOINT.BIKE.ID(id),
      data
    );
    return response;
  },
  //for user
  reportBrokenBike: async (id: string): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.patch(
      ENDPOINT.BIKE.REPORT_BROKEN(id)
    );
    return response;
  },
  //all
  getBikeByIdForAll: async (
    id: string
  ): Promise<AxiosResponse<Bike>> => {
    const response = await fetchHttpClient.get<Bike>(
      ENDPOINT.BIKE.ID(id)
    );
    return response;
  },
  getAllBikes: async ({
    id,
    page,
    pageSize,
    stationId,
    supplierId,
    status,
  }: {
    id?: string;
    page?: number;
    pageSize?: number;
    stationId?: string;
    supplierId?: string;
    status?: BikeStatus;
  }): Promise<AxiosResponse<ApiResponse<Bike[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Bike[]>>(
      ENDPOINT.BIKE.BASE,
      {
        id : id,
        page : page,
        pageSize : pageSize,
        stationId : stationId,
        supplierId : supplierId,
        status : status,
      }
    );
    return response;
  },
  getBikeActivityStats: async (
    id: string
  ): Promise<AxiosResponse<BikeActivityStats>> => {
    const response = await fetchHttpClient.get<BikeActivityStats>(
      ENDPOINT.BIKE.ACTIVITY_STATS(id)
    );
    return response;
  },
  getStatisticsBike: async (
    id: string
  ): Promise<AxiosResponse<BikeStats>> => {
    const response = await fetchHttpClient.get<BikeStats>(
      ENDPOINT.BIKE.STATS_BIKE(id)
    );
    return response;
  },
  getRentalHistoryBike: async (
    id: string
  ): Promise<AxiosResponse<BikeRentalHistory>> => {
    const response = await fetchHttpClient.get<BikeRentalHistory>(
      ENDPOINT.BIKE.RENTAL_HISTORY(id)
    );
    return response;
  },
};

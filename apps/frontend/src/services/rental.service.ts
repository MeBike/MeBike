import type { AxiosResponse } from "axios";
import type { RentalSchemaFormData, UpdateRentalSchema } from "@/schemas/rental-schema";
import fetchHttpClient from "@lib/httpClient";
import type { Rental, RentalStatus } from "@custom-types";
import { StatwithRevenue } from "@custom-types";
import { RentalRecord , SummaryRental ,Dashboardsummary } from "@custom-types";
import { ENDPOINT } from "@/constants";
import { ApiResponse } from "@custom-types";

import { EndRentalSchema } from "@/schemas/rental-schema";
const RENTAL_BASE = "/rentals";
const RENTAL_ENDPOINTS = {
  BASE: RENTAL_BASE,
  USER_RENT: () => `${RENTAL_BASE}`,
  USER_RENTAL_ME: () => `${RENTAL_BASE}/me`,
  USER_RENTAL_DETAIL: (id: string) => `${RENTAL_BASE}/me/${id}`,
  USER_CURRENT_RENTAL: () => `${RENTAL_BASE}/me/current`,
  END_USER_CURRENT_RENTAL: (id: string) => `${RENTAL_BASE}/me/${id}/end`,
  ADMIN_RENTAL_REVENUE: () => `${RENTAL_BASE}/stats/revenue`,
  ADMIN_STATS_STATION_ACTIVITY: () => `${RENTAL_BASE}/stats/station-activity`,
  ADMIN_STATS_RESERVATIONS: () => `${RENTAL_BASE}/stats/reservations`,
  ADMIN_CANCEL_RENTAL: (id: string) => `${RENTAL_BASE}/${id}/cancel`,
  STAFF_ADMIN_GET_ALL_RENTALS: () => `${RENTAL_BASE}`,
  STAFF_ADMIN_GET_DETAIL_RENTAL: (id: string) => `${RENTAL_BASE}/${id}`,
  STAFF_ADMIN_UPDATE_DETAIL_RENTAL: (id: string) => `${RENTAL_BASE}/${id}`,
  GET_REVENUE: () => `${RENTAL_BASE}/stats/revenue`,
  GET_STATS_STATION_ACTIVITY: () => `${RENTAL_BASE}/stats/station-activity`,
  GET_RESERVATION_STATS: () => `${RENTAL_BASE}/stats/reservations`,
  UPDATE_RENTAL_DETAIL: (id: string) => `${RENTAL_BASE}/${id}`,
  END_RENTAL: (id: string) => `${RENTAL_BASE}/${id}/end`,
  CANCEL_RENTAL: (id: string) => `${RENTAL_BASE}/${id}/cancel`,
  DETAIL_RENTAL: (id: string) => `${RENTAL_BASE}/${id}`,
  DASHBOARD_RENTAL_STATS: () => `${RENTAL_BASE}/dashboard-summary`,
  END_RENTAL_SOS: (id: string) => `${RENTAL_BASE}/${id}/end`,
  SUMMARY: () => `${RENTAL_BASE}/summary`,
};
interface DetailApiResponse<T> {
  result: T;
  message: string;
}
export const rentalService = {
  userPostRent: async (
    data: RentalSchemaFormData
  ): Promise<AxiosResponse<DetailApiResponse<Rental>>> => {
    const response = await fetchHttpClient.post<
      DetailApiResponse<Rental>
    >(RENTAL_ENDPOINTS.USER_RENT(), data);
    return response;
  },
  userGetAllRentalsForUser: async (
    page: number,
    limit: number
  ): Promise<AxiosResponse<ApiResponse<Rental>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Rental>>(
      RENTAL_ENDPOINTS.USER_RENTAL_ME(),
      {
        params: {
          page,
          limit,
        },
      }
    );
    return response;
  },
  userGetCurrentRentals: async (): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.get(
      RENTAL_ENDPOINTS.USER_CURRENT_RENTAL()
    );
    return response;
  },
  userPutEndCurrentRental: async (id: string): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.put<AxiosResponse>(
      RENTAL_ENDPOINTS.END_USER_CURRENT_RENTAL(id)
    );
    return response;
  },
  userGetRentalById: async (id: string): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.get(
      RENTAL_ENDPOINTS.USER_RENTAL_DETAIL(id)
    );
    return response;
  },
  //dashboard
  adminGetRentalRevenue: async (): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.get(
      RENTAL_ENDPOINTS.ADMIN_RENTAL_REVENUE()
    );
    return response;
  },
  adminGetStationActivity: async (): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.get(
      RENTAL_ENDPOINTS.ADMIN_STATS_STATION_ACTIVITY()
    );
    return response;
  },
  adminGetStatisticReservations: async (): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.get(
      RENTAL_ENDPOINTS.ADMIN_STATS_RESERVATIONS()
    );
    return response;
  },
  adminPostCancelRental: async (id: string): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.post(
      RENTAL_ENDPOINTS.ADMIN_CANCEL_RENTAL(id)
    );
    return response;
  },
  staffAdminGetAllRentals: async (): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.get(
      RENTAL_ENDPOINTS.STAFF_ADMIN_GET_ALL_RENTALS()
    );
    return response;
  },
  staffAdminGetDetailRental: async (id: string): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.get(
      RENTAL_ENDPOINTS.STAFF_ADMIN_GET_DETAIL_RENTAL(id)
    );
    return response;
  },
  getAllRentalsForStaffAdmin: async ({
    page,
    pageSize,
    startStation,
    endStation,
    status,
    userId,
    bikeId,
  }: {
    page ?: number,
    pageSize ?: number,
    startStation ?: string,
    endStation ?: string,
    status ?: RentalStatus,
    userId ?: string,
    bikeId ?: string,
  }): Promise<
    AxiosResponse<ApiResponse<Rental[]>>
  > => {
    const response = await fetchHttpClient.get<ApiResponse<Rental[]>>(
      ENDPOINT.RENTAL.BASE,
      {
        page : page,
        pageSize : pageSize,
        startStation : startStation,
        endStation : endStation,
        status : status,
        userId : userId,
        bikeId : bikeId
      }
    );
    return response;
  },
  getAllRentalsForStaff: async ({
    page,
    pageSize,
    startStation,
    endStation,
    status,
    userId,
    bikeId,
  }: {
    page ?: number,
    pageSize ?: number,
    startStation ?: string,
    endStation ?: string,
    status ?: RentalStatus,
    userId ?: string,
    bikeId ?: string,
  }): Promise<
    AxiosResponse<ApiResponse<Rental[]>>
  > => {
    const response = await fetchHttpClient.get<ApiResponse<Rental[]>>(
      ENDPOINT.RENTAL.STAFF,
      {
        page : page,
        pageSize : pageSize,
        startStation : startStation,
        endStation : endStation,
        status : status,
        userId : userId,
        bikeId : bikeId
      }
    );
    return response;
  },
  getRevenue: async ({
    from,
    to,
    groupBy,
  }: {
    from?: string;
    to?: string;
    groupBy?: "MONTH" | "YEAR" | "DAY";
  }): Promise<AxiosResponse<StatwithRevenue>> => {
    const response = await fetchHttpClient.get<
      StatwithRevenue
    >(RENTAL_ENDPOINTS.GET_REVENUE(), {
      from,
      to,
      groupBy,
    });
    return response;
  },
  getDetailRental: async (
    id: string
  ): Promise<AxiosResponse<RentalRecord>> => {
    const response = await fetchHttpClient.get<RentalRecord>(
      ENDPOINT.RENTAL.ID(id)
    );
    return response;
  },
  getDetailRentalForStaff: async (
    id: string
  ): Promise<AxiosResponse<RentalRecord>> => {
    const response = await fetchHttpClient.get<RentalRecord>(
      ENDPOINT.RENTAL.STAFF_ID(id)
    );
    return response;
  },
  updateDetailRental: async (
    id: string,
    data: UpdateRentalSchema
  ): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.put(
      RENTAL_ENDPOINTS.UPDATE_RENTAL_DETAIL(id),
      data
    );
    return response;
  },
  getDashboardRentalStats: async (): Promise<
    AxiosResponse<Dashboardsummary>
  > => {
    const response = await fetchHttpClient.get<
      Dashboardsummary
    >(RENTAL_ENDPOINTS.DASHBOARD_RENTAL_STATS());
    return response;
  },
  endRentalByReport: async (
    id: string,
    data: EndRentalSchema
  ): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.put(
      RENTAL_ENDPOINTS.END_RENTAL_SOS(id),
      data
    );
    return response;
  },
  getSummaryRental : async (): Promise<AxiosResponse<SummaryRental>> => {
    const response = await fetchHttpClient.get<SummaryRental>(
      ENDPOINT.RENTAL.GET_SUMMARY
    );
    return response;
  }
  // staffAdminUpdateDetailRental: async (
  //   id: string,
  //   data: any
  // ): Promise<AxiosResponse> => {
  //   const response = await fetchHttpClient.put(
  //     RENTAL_ENDPOINTS.STAFF_ADMIN_UPDATE_DETAIL_RENTAL(id),
  //     data
  //   );
  //   return response;
  // },
};

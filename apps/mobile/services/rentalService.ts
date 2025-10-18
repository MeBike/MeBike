import fetchHttpClient from "@lib/httpClient";
import type { AxiosResponse } from "axios";
import type { RentingHistory } from "../types/RentalTypes";
const RENTAL_BASE = "/rentals";
const RENTAL_ENDPOINTS = {
  BASE: RENTAL_BASE,
  USER_RENT : () => `${RENTAL_BASE}`,
  USER_RENTAL_ME: () => `${RENTAL_BASE}/me`,
  USER_RENTAL_DETAIL: (id: string) => `${RENTAL_BASE}/me/${id}`,
  USER_CURRENT_RENTAL: () => `${RENTAL_BASE}/me/current`,
  END_USER_CURRENT_RENTAL: (id: string) => `${RENTAL_BASE}/me/${id}/end`,
  ADMIN_RENTAL_REVENUE : () => `${RENTAL_BASE}/stats/revenue`,
  ADMIN_STATS_STATION_ACTIVITY : () => `${RENTAL_BASE}/stats/station-activity`,
  ADMIN_STATS_RESERVATIONS : () => `${RENTAL_BASE}/stats/reservations`,
  ADMIN_CANCEL_RENTAL : (id: string) => `${RENTAL_BASE}/${id}/cancel`,
  STAFF_ADMIN_GET_ALL_RENTALS : () => `${RENTAL_BASE}`,
  STAFF_ADMIN_GET_DETAIL_RENTAL : (id: string) => `${RENTAL_BASE}/${id}`,
  STAFF_ADMIN_UPDATE_DETAIL_RENTAL : (id: string) => `${RENTAL_BASE}/${id}`,
};
import type { RentalSchemaFormData } from "@schemas/rentalSchema";
export const rentalService = {
  userPostRent: async (data: RentalSchemaFormData): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.post(
      RENTAL_ENDPOINTS.USER_RENT(),
      data
    );
    return response;
  },
  userGetAllRentals: async (page: number, limit: number): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.get(
      "/rentals/me",
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
    const response = await fetchHttpClient.put(
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
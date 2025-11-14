import type { AxiosResponse } from "axios";

import type { RentalSchemaFormData } from "@schemas/rentalSchema";

import fetchHttpClient from "@lib/httpClient";

import type { Pagination } from "../types/Pagination";
import type { RentingHistory, StaffActiveRental } from "../types/RentalTypes";

const RENTAL_BASE = "/rentals";
const RENTAL_ENDPOINTS = {
  BASE: RENTAL_BASE,
  USER_RENT: () => `${RENTAL_BASE}`,
  USER_RENTAL_ME: () => `${RENTAL_BASE}/me`,
  USER_RENTAL_DETAIL: (id: string) => `${RENTAL_BASE}/me/${id}`,
  USER_CURRENT_RENTAL: () => `${RENTAL_BASE}/me/current`,
  END_USER_CURRENT_RENTAL: (id: string) => `${RENTAL_BASE}/me/${id}/end`,
  STAFF_ADMIN_GET_DETAIL_RENTAL: (id: string) => `${RENTAL_BASE}/${id}`,
  STAFF_ADMIN_END_RENTAL: (id: string) => `${RENTAL_BASE}/${id}/end`,
  STAFF_ACTIVE_RENTALS_BY_PHONE: (phone: string) =>
    `${RENTAL_BASE}/by-phone/${phone}/active`,
};
type RentalResponse = {
  data: RentingHistory[];
  pagination: Pagination;
};
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
type StaffActiveRentalsResponse = {
  data: StaffActiveRental[];
  pagination: Pagination;
};
export const rentalService = {
  userPostRent: async (
    data: RentalSchemaFormData
  ): Promise<AxiosResponse<DetailApiResponse<RentingHistory>>> => {
    const response = await fetchHttpClient.post<DetailApiResponse<RentingHistory>>(
      RENTAL_ENDPOINTS.USER_RENT(),
      data
    );
    return response;
  },
  userGetAllRentals: async (
    page: number,
    limit: number
  ): Promise<AxiosResponse<RentalResponse>> => {
    const response = await fetchHttpClient.get<RentalResponse>(
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
  staffAdminGetDetailRental: async (id: string): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.get(
      RENTAL_ENDPOINTS.STAFF_ADMIN_GET_DETAIL_RENTAL(id)
    );
    return response;
  },
  staffAdminEndRental: async (
    id: string,
    payload: { end_station: string; end_time?: string; reason: string }
  ): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.put(
      RENTAL_ENDPOINTS.STAFF_ADMIN_END_RENTAL(id),
      payload
    );
    return response;
  },
  staffGetActiveRentalsByPhone: async (
    phone: string,
    params?: { page?: number; limit?: number }
  ): Promise<AxiosResponse<StaffActiveRentalsResponse>> => {
    const response = await fetchHttpClient.get<StaffActiveRentalsResponse>(
      RENTAL_ENDPOINTS.STAFF_ACTIVE_RENTALS_BY_PHONE(phone),
      {
        params,
      }
    );
    return response;
  },
};

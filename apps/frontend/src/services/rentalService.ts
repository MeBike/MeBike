import fetchHttpClient from "@lib/httpClient";
import type { AxiosResponse } from "axios";
const RENTAL_BASE = "/rentals";
const RENTAL_ENDPOINTS = {
  BASE: RENTAL_BASE,
  USER_RENTAL: () => `${RENTAL_BASE}/me`,
  USER_RENTAL_DETAIL: (id: string) => `${RENTAL_BASE}/me/${id}`,
  USER_CURRENT_RENTAL: () => `${RENTAL_BASE}/me/current`,
  END_USER_CURRENT_RENTAL: (id: string) => `${RENTAL_BASE}/me/${id}/end`,
};

export const rentalService = {
  userGetAllRentals: async (): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.get(RENTAL_ENDPOINTS.USER_RENTAL());
    return response;
  },
    userGetCurrentRentals: async (): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.get(RENTAL_ENDPOINTS.USER_CURRENT_RENTAL());
    return response;
  },
  userPutEndCurrentRental: async (id: string): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.put(RENTAL_ENDPOINTS.END_USER_CURRENT_RENTAL(id));
    return response;
  },
  userGetRentalById: async (id: string): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.get(RENTAL_ENDPOINTS.USER_RENTAL_DETAIL(id));
    return response;
  },
};
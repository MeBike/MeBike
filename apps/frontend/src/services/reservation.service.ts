import fetchHttpClient from "@/lib/httpClient";
import type { AxiosResponse } from "axios";
import { ApiResponse, Reservation , DetailApiResponse} from "@custom-types";
const RESERVATION_BASE = "/reservations";
const RESERVATION_ENDPOINTS = {
  BASE: RESERVATION_BASE,
  USER_RESERVATIONS: `${RESERVATION_BASE}/user`,
  ID: (id: string) => `${RESERVATION_BASE}/${id}`,
} as const;
export const reservationService = {
  getUserReservations: async (): Promise<AxiosResponse<ApiResponse<Reservation[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Reservation[]>>(
      RESERVATION_ENDPOINTS.USER_RESERVATIONS
    );
    return response;
  },
  getDetailReservation : async (id: string): Promise<AxiosResponse<DetailApiResponse<Reservation>>> => {
    const response = await fetchHttpClient.get<DetailApiResponse<Reservation>>(
      RESERVATION_ENDPOINTS.ID(id)
    );
    return response;
  }

};

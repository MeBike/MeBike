import fetchHttpClient from "@/lib/httpClient";
import type { AxiosResponse } from "axios";
import {
  ApiResponse,
  Reservation,
  DetailApiResponse,
  ReservationStats,
} from "@custom-types";
const RESERVATION_BASE = "/reservations";
const RESERVATION_ENDPOINTS = {
  BASE: RESERVATION_BASE,
  USER_RESERVATIONS: `${RESERVATION_BASE}/user`,
  ID: (id: string) => `${RESERVATION_BASE}/${id}`,
  STATS: `${RESERVATION_BASE}/stats`,
  STATS_STATION: (stationId: string) =>
    `${RESERVATION_BASE}/${stationId}/stats`,
  DISPATCH: `${RESERVATION_BASE}/dispatch`,
  STAFF_CONFIRM: (id: string) => `${RESERVATION_BASE}/${id}/staff-confirm`,
  STAFF_CANCEL: (id: string) => `${RESERVATION_BASE}/${id}/staff-cancel`,
} as const;
export const reservationService = {
  getUserReservations: async (): Promise<
    AxiosResponse<ApiResponse<Reservation[]>>
  > => {
    const response = await fetchHttpClient.get<ApiResponse<Reservation[]>>(
      RESERVATION_ENDPOINTS.USER_RESERVATIONS
    );
    return response;
  },
  getDetailReservation: async (
    id: string
  ): Promise<AxiosResponse<DetailApiResponse<Reservation>>> => {
    const response = await fetchHttpClient.get<DetailApiResponse<Reservation>>(
      RESERVATION_ENDPOINTS.ID(id)
    );
    return response;
  },
  getReservationStats: async (): Promise<
    AxiosResponse<DetailApiResponse<ReservationStats[]>>
  > => {
    const response = await fetchHttpClient.get<
      DetailApiResponse<ReservationStats[]>
    >(RESERVATION_ENDPOINTS.STATS);
    return response;
  },
  getStationReservationStats: async (
    stationId: string
  ): Promise<AxiosResponse<DetailApiResponse<ReservationStats>>> => {
    const response = await fetchHttpClient.get<
      DetailApiResponse<ReservationStats>
    >(RESERVATION_ENDPOINTS.STATS_STATION(stationId));
    return response;
  },
  getDispatchReservation: async (): Promise<
    AxiosResponse<DetailApiResponse<Reservation>>
  > => {
    const response = await fetchHttpClient.get<DetailApiResponse<Reservation>>(
      RESERVATION_ENDPOINTS.DISPATCH
    );
    return response;
  },
  getStaffConfirmReservation: async (
    id: string
  ): Promise<AxiosResponse<DetailApiResponse<Reservation>>> => {
    const response = await fetchHttpClient.get<DetailApiResponse<Reservation>>(
      RESERVATION_ENDPOINTS.STAFF_CONFIRM(id)
    );
    return response;
  },
  getStaffCancelReservation: async (
    id: string
  ): Promise<AxiosResponse<DetailApiResponse<Reservation>>> => {
    const response = await fetchHttpClient.get<DetailApiResponse<Reservation>>(
      RESERVATION_ENDPOINTS.STAFF_CANCEL(id)
    );
    return response;
  },
};

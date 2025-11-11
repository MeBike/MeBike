import type { AxiosResponse } from "axios";

import fetchHttpClient from "@lib/httpClient";

import type {
  PaginatedReservations,
  Reservation,
} from "../types/reservation-types";

const RESERVATION_BASE = "/reservations";

const RESERVATION_ENDPOINTS = {
  BASE: RESERVATION_BASE,
  HISTORY: `${RESERVATION_BASE}/history`,
  DETAIL: (id: string) => `${RESERVATION_BASE}/${id}`,
  CONFIRM: (id: string) => `${RESERVATION_BASE}/${id}/confirm`,
  CANCEL: (id: string) => `${RESERVATION_BASE}/${id}/cancel`,
};

type PaginatedParams = {
  page?: number;
  limit?: number;
};

export type ReservationOption = "MỘT LẦN" | "GÓI THÁNG";

export type CreateReservationPayload = {
  bike_id: string;
  start_time: string;
  reservation_option: ReservationOption;
  subscription_id?: string;
  fixed_slot_template_id?: string;
};

export type CancelReservationPayload = {
  reason: string;
};

export const reservationService = {
  createReservation: async (
    payload: CreateReservationPayload,
  ): Promise<AxiosResponse<{ message: string; result: Reservation }>> => {
    return fetchHttpClient.post(RESERVATION_ENDPOINTS.BASE, payload);
  },

  getMyReservations: async (
    params: PaginatedParams = {},
  ): Promise<AxiosResponse<PaginatedReservations>> => {
    return fetchHttpClient.get(RESERVATION_ENDPOINTS.BASE, params);
  },

  getReservationHistory: async (
    params: PaginatedParams = {},
  ): Promise<AxiosResponse<PaginatedReservations>> => {
    return fetchHttpClient.get(RESERVATION_ENDPOINTS.HISTORY, params);
  },

  getReservationDetails: async (
    id: string,
  ): Promise<AxiosResponse<any>> => {
    return fetchHttpClient.get(RESERVATION_ENDPOINTS.DETAIL(id));
  },

  cancelReservation: async (
    id: string,
    payload: CancelReservationPayload,
  ): Promise<AxiosResponse<{ message: string }>> => {
    return fetchHttpClient.post(RESERVATION_ENDPOINTS.CANCEL(id), payload);
  },

  confirmReservation: async (
    id: string,
  ): Promise<AxiosResponse<{ message: string }>> => {
    return fetchHttpClient.post(RESERVATION_ENDPOINTS.CONFIRM(id));
  },
};

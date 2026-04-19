import fetchHttpClient from "@/lib/httpClient";
import type { AxiosResponse } from "axios";
import {
  ApiResponse,
  Reservation,
  DetailReservation,
  ReservationOverview,
} from "@custom-types";
import { ENDPOINT } from "@/constants";
export const reservationService = {
  getUserReservations: async ({
    page,
    pageSize,
    status,
    option,
  }: {
    page?: number;
    pageSize?: number;
    status ?: "PENDING" | "FULFILLED" | "CANCELLED" | "EXPIRED";
    option ?: "ONE_TIME" | "FIXED_SLOT" | "SUBSCRIPTION";
  }): Promise<AxiosResponse<ApiResponse<Reservation[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Reservation[]>>(
      ENDPOINT.RESERVATION.BASE,
      {
        page : page,
        pageSize : pageSize,
        status : status,
        reservationOption : option,
      },
    );
    return response;
  },
  getUserReservationsForStaff: async ({
    page,
    pageSize,
    status,
    option,
  }: {
    page?: number;
    pageSize?: number;
    status ?: "PENDING" | "FULFILLED" | "CANCELLED" | "EXPIRED";
    option ?: "ONE_TIME" | "FIXED_SLOT" | "SUBSCRIPTION";
  }): Promise<AxiosResponse<ApiResponse<Reservation[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Reservation[]>>(
      ENDPOINT.RESERVATION.STAFF,
      {
        page : page,
        pageSize : pageSize,
        status : status,
        reservationOption : option,
      },
    );
    return response;
  },
  getDetailReservationForStaff: async (
    id: string,
  ): Promise<AxiosResponse<DetailReservation>> => {
    const response = await fetchHttpClient.get<DetailReservation>(
      ENDPOINT.RESERVATION.STAFF_ID(id),
    );
    return response;
  },
  getDetailReservation: async (
    id: string,
  ): Promise<AxiosResponse<DetailReservation>> => {
    const response = await fetchHttpClient.get<DetailReservation>(
      ENDPOINT.RESERVATION.ID(id),
    );
    return response;
  },
  getReservationStats: async (): Promise<
    AxiosResponse<ReservationOverview>
  > => {
    const response = await fetchHttpClient.get<ReservationOverview>(
      ENDPOINT.RESERVATION.OVERVIEW,
    );
    return response;
  },
  getReservationInMyStation: async ({
    page,
    pageSize,
    status,
    option,
  }: {
    page?: number;
    pageSize?: number;
    status ?: "PENDING" | "FULFILLED" | "CANCELLED" | "EXPIRED";
    option ?: "ONE_TIME" | "FIXED_SLOT" | "SUBSCRIPTION";
  }): Promise<AxiosResponse<ApiResponse<Reservation[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Reservation[]>>(
      ENDPOINT.STAFF.RESERVATION,
      {
        page : page,
        pageSize : pageSize,
        status : status,
        reservationOption : option,
      },
    );
    return response;
  },
  getReservationDetailInMyStation: async (
    id: string,
  ): Promise<AxiosResponse<DetailReservation>> => {
    const response = await fetchHttpClient.get<DetailReservation>(
      ENDPOINT.STAFF.RESERVATION_DETAIL(id),
    );
    return response;
  },
};

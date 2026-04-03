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
  }: {
    page?: number;
    pageSize?: number;
  }): Promise<AxiosResponse<ApiResponse<Reservation[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Reservation[]>>(
      ENDPOINT.RESERVATION.BASE,
      {
        page : page,
        pageSize : pageSize,
      },
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
};

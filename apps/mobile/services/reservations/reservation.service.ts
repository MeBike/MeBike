import type { Result } from "@lib/result";
import type { z } from "zod";

import { decodeWithSchema, readJson } from "@lib/api-decode";
import { kyClient } from "@lib/ky-client";
import { err, ok } from "@lib/result";
import { routePath, ServerRoutes } from "@lib/server-routes";
import { toSearchParams } from "@services/shared/search-params";
import { StatusCodes } from "http-status-codes";

import type {
  CreateReservationPayload,
  PaginatedReservations,
  Reservation,
  ReservationDetail,
  ReservationExpandedDetail,
  ReservationOption,
  ReservationStatus,
} from "@/types/reservation-types";

import type { ReservationError } from "./reservation-error";

import { asNetworkError, parseReservationError } from "./reservation-error";

export type { CreateReservationPayload };

type ReservationListParams = {
  page?: number;
  pageSize?: number;
  status?: ReservationStatus;
  stationId?: string;
  reservationOption?: ReservationOption;
};

const CURRENT_RESERVATION_STATUSES: ReservationStatus[] = ["PENDING"];
const RESERVATION_HISTORY_STATUSES: ReservationStatus[] = ["FULFILLED", "CANCELLED", "EXPIRED"];

async function decodeReservationResponse<TRaw, TValue>(
  response: Response,
  schema: z.ZodType<TRaw>,
  map: (value: TRaw) => TValue,
): Promise<Result<TValue, ReservationError>> {
  try {
    const data = await readJson(response);
    const parsed = decodeWithSchema(schema, data);
    return parsed.ok ? ok(map(parsed.value)) : err({ _tag: "DecodeError" });
  }
  catch {
    return err({ _tag: "DecodeError" });
  }
}

function mapReservation(detail: ReservationDetail | ReservationExpandedDetail): Reservation {
  return {
    ...detail,
    station: "station" in detail ? detail.station : undefined,
    bike: "bike" in detail ? detail.bike : undefined,
  };
}

function mapPagination(
  pagination: PaginatedReservations["pagination"],
): PaginatedReservations["pagination"] {
  return {
    pageSize: pagination.pageSize,
    page: pagination.page,
    totalPages: pagination.totalPages,
    total: pagination.total,
  };
}

function filterReservations(
  reservations: Reservation[],
  statuses: ReservationStatus[],
) {
  const statusSet = new Set(statuses);
  return reservations.filter(item => statusSet.has(item.status));
}

export const reservationService = {
  createReservation: async (
    payload: CreateReservationPayload,
  ): Promise<Result<Reservation, ReservationError>> => {
    try {
      const response = await kyClient.post(routePath(ServerRoutes.reservations.reserveBike), {
        json: payload,
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.reservations.reserveBike.responses[200].content["application/json"].schema;
        return decodeReservationResponse(response, okSchema as z.ZodType<ReservationDetail>, mapReservation);
      }

      return err(await parseReservationError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  getMyReservations: async (
    params: ReservationListParams = {},
  ): Promise<Result<PaginatedReservations, ReservationError>> => {
    try {
      const response = await kyClient.get(routePath(ServerRoutes.reservations.listMyReservations), {
        searchParams: toSearchParams(params),
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.reservations.listMyReservations.responses[200].content["application/json"].schema;
        return decodeReservationResponse(response, okSchema as z.ZodType<PaginatedReservations>, value => ({
          data: value.data.map(mapReservation),
          pagination: mapPagination(value.pagination),
        }));
      }

      return err(await parseReservationError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  getReservationHistory: async (
    params: Omit<ReservationListParams, "status"> = {},
  ): Promise<Result<PaginatedReservations, ReservationError>> => {
    const result = await reservationService.getMyReservations(params);
    if (!result.ok) {
      return result;
    }

    return ok({
      data: filterReservations(result.value.data, RESERVATION_HISTORY_STATUSES),
      pagination: result.value.pagination,
    });
  },

  getCurrentReservations: async (
    params: Omit<ReservationListParams, "status"> = {},
  ): Promise<Result<PaginatedReservations, ReservationError>> => {
    const result = await reservationService.getMyReservations(params);
    if (!result.ok) {
      return result;
    }

    return ok({
      data: filterReservations(result.value.data, CURRENT_RESERVATION_STATUSES),
      pagination: result.value.pagination,
    });
  },

  getReservationDetails: async (reservationId: string): Promise<Result<Reservation, ReservationError>> => {
    try {
      const path = routePath(ServerRoutes.reservations.getMyReservation, { reservationId });

      const response = await kyClient.get(path, { throwHttpErrors: false });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.reservations.getMyReservation.responses[200].content["application/json"].schema;
        return decodeReservationResponse(response, okSchema as z.ZodType<ReservationExpandedDetail>, mapReservation);
      }

      return err(await parseReservationError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  cancelReservation: async (reservationId: string): Promise<Result<Reservation, ReservationError>> => {
    try {
      const path = routePath(ServerRoutes.reservations.cancelReservation, { reservationId });

      const response = await kyClient.post(path, { throwHttpErrors: false });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.reservations.cancelReservation.responses[200].content["application/json"].schema;
        return decodeReservationResponse(response, okSchema as z.ZodType<ReservationDetail>, mapReservation);
      }

      return err(await parseReservationError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  confirmReservation: async (reservationId: string): Promise<Result<Reservation, ReservationError>> => {
    try {
      const path = routePath(ServerRoutes.reservations.confirmReservation, { reservationId });

      const response = await kyClient.post(path, { throwHttpErrors: false });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.reservations.confirmReservation.responses[200].content["application/json"].schema;
        return decodeReservationResponse(response, okSchema as z.ZodType<ReservationDetail>, mapReservation);
      }

      return err(await parseReservationError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },
};

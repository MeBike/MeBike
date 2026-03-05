import type { Result } from "@lib/result";
import type { ServerContracts } from "@mebike/shared";

import { decodeWithSchema, readJson } from "@lib/api-decode";
import { kyClient } from "@lib/ky-client";
import { err, ok } from "@lib/result";
import { routePath, ServerRoutes } from "@lib/server-routes";
import { StatusCodes } from "http-status-codes";

import type { Reservation, ReservationStatus } from "@/types/reservation-types";

import type { PaginatedReservations } from "../../types/reservation-types";
import type { ReservationError } from "./reservation-error";

import { asNetworkError, parseReservationError } from "./reservation-error";

type ReservationDetail = ServerContracts.ReservationsContracts.ReservationDetail;
type ReservationListResponse = ServerContracts.ReservationsContracts.ListMyReservationsResponse;
export type ReservationStatusV1 = "PENDING" | "ACTIVE" | "CANCELLED" | "EXPIRED";
export type ReservationOptionV1 = "ONE_TIME" | "FIXED_SLOT" | "SUBSCRIPTION";
export type CreateReservationPayload = ServerContracts.ReservationsContracts.CreateReservationRequest;

type ReservationListParams = {
  page?: number;
  pageSize?: number;
  status?: ReservationStatusV1;
  stationId?: string;
  reservationOption?: ReservationOptionV1;
};

const statusLabelMap: Record<ReservationStatusV1, ReservationStatus> = {
  PENDING: "ĐANG CHỜ XỬ LÍ",
  ACTIVE: "ĐANG HOẠT ĐỘNG",
  CANCELLED: "ĐÃ HUỶ",
  EXPIRED: "ĐÃ HẾT HẠN",
};

function toSearchParams(
  params: Record<string, unknown> | undefined,
): Record<string, string> | undefined {
  if (!params) {
    return undefined;
  }

  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => [key, String(value)]);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapReservation(detail: ReservationDetail): Reservation {
  return {
    id: detail.id,
    userId: detail.userId,
    bikeId: detail.bikeId ?? "",
    stationId: detail.stationId,
    station: undefined,
    startTime: detail.startTime,
    endTime: detail.endTime ?? null,
    prepaid: toNumber(detail.prepaid),
    status: statusLabelMap[detail.status],
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
  };
}

function mapPagination(
  pagination: ReservationListResponse["pagination"],
): PaginatedReservations["pagination"] {
  return {
    pageSize: pagination.pageSize,
    page: pagination.page,
    totalPages: pagination.totalPages,
    total: pagination.total,
  };
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
        const data = await readJson(response);
        const parsed = decodeWithSchema(okSchema, data);
        return parsed.ok ? ok(mapReservation(parsed.value)) : err({ _tag: "DecodeError" });
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
        const data = await readJson(response);
        const parsed = decodeWithSchema(okSchema, data);

        if (!parsed.ok) {
          return err({ _tag: "DecodeError" });
        }

        return ok({
          data: parsed.value.data.map(mapReservation),
          pagination: mapPagination(parsed.value.pagination),
        });
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
      data: result.value.data.filter(item => item.status !== "ĐANG CHỜ XỬ LÍ"),
      pagination: result.value.pagination,
    });
  },

  getReservationDetails: async (reservationId: string): Promise<Result<Reservation, ReservationError>> => {
    try {
      const path = routePath(ServerRoutes.reservations.getMyReservation)
        .replace("{reservationId}", reservationId)
        .replace(":reservationId", reservationId);

      const response = await kyClient.get(path, { throwHttpErrors: false });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.reservations.getMyReservation.responses[200].content["application/json"].schema;
        const data = await readJson(response);
        const parsed = decodeWithSchema(okSchema, data);
        return parsed.ok ? ok(mapReservation(parsed.value)) : err({ _tag: "DecodeError" });
      }

      return err(await parseReservationError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  cancelReservation: async (reservationId: string): Promise<Result<Reservation, ReservationError>> => {
    try {
      const path = routePath(ServerRoutes.reservations.cancelReservation)
        .replace("{reservationId}", reservationId)
        .replace(":reservationId", reservationId);

      const response = await kyClient.post(path, { throwHttpErrors: false });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.reservations.cancelReservation.responses[200].content["application/json"].schema;
        const data = await readJson(response);
        const parsed = decodeWithSchema(okSchema, data);
        return parsed.ok ? ok(mapReservation(parsed.value)) : err({ _tag: "DecodeError" });
      }

      return err(await parseReservationError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  confirmReservation: async (reservationId: string): Promise<Result<Reservation, ReservationError>> => {
    try {
      const path = routePath(ServerRoutes.reservations.confirmReservation)
        .replace("{reservationId}", reservationId)
        .replace(":reservationId", reservationId);

      const response = await kyClient.post(path, { throwHttpErrors: false });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.reservations.confirmReservation.responses[200].content["application/json"].schema;
        const data = await readJson(response);
        const parsed = decodeWithSchema(okSchema, data);
        return parsed.ok ? ok(mapReservation(parsed.value)) : err({ _tag: "DecodeError" });
      }

      return err(await parseReservationError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },
};

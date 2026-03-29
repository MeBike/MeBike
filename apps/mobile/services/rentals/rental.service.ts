import type { Result } from "@lib/result";
import type { z } from "zod";

import { decodeWithSchema, readJson } from "@lib/api-decode";
import { kyClient } from "@lib/ky-client";
import { err, ok } from "@lib/result";
import { routePath, ServerRoutes } from "@lib/server-routes";
import { StatusCodes } from "http-status-codes";

import type {
  CreateRentalPayload,
  CreateReturnSlotPayload,
  MyRentalListResponse,
  MyRentalResolvedDetail,
  Rental,
  RentalCounts,
  RentalDetail,
  RentalListParams,
  RentalListResponse,
  RentalWithPrice,
  RentalWithPricing,
  ReturnSlotReservation,
} from "@/types/rental-types";

import { bikeService } from "@/services/bike.service";
import { stationService } from "@/services/station.service";

import type { RentalError } from "./rental-error";

import { asNetworkError, parseRentalError } from "./rental-error";

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

async function decodeRentalResponse<TRaw, TValue>(
  response: Response,
  schema: z.ZodType<TRaw>,
  map: (value: TRaw) => TValue,
): Promise<Result<TValue, RentalError>> {
  try {
    const data = await readJson(response);
    const parsed = decodeWithSchema(schema, data);
    return parsed.ok ? ok(map(parsed.value)) : err({ _tag: "DecodeError" });
  }
  catch {
    return err({ _tag: "DecodeError" });
  }
}

async function tryGetBikeSummary(bikeId?: string): Promise<MyRentalResolvedDetail["bike"]> {
  if (!bikeId) {
    return null;
  }

  try {
    const result = await bikeService.getBikeByIdForAll(bikeId);
    return result.ok ? result.value : null;
  }
  catch {
    return null;
  }
}

async function tryGetStationSummary(stationId?: string): Promise<MyRentalResolvedDetail["startStation"]> {
  if (!stationId) {
    return null;
  }

  try {
    const result = await stationService.getStationById(stationId);
    return result.ok ? result.value : null;
  }
  catch {
    return null;
  }
}

async function tryGetCurrentReturnSlot(rentalId: string): Promise<ReturnSlotReservation | null> {
  try {
    const path = routePath(ServerRoutes.rentals.getMyCurrentReturnSlot, { rentalId });

    const response = await kyClient.get(path, { throwHttpErrors: false });
    if (response.status === StatusCodes.OK) {
      const okSchema = ServerRoutes.rentals.getMyCurrentReturnSlot.responses[200].content["application/json"].schema;
      const result = await decodeRentalResponse(
        response,
        okSchema as z.ZodType<{ result: ReturnSlotReservation }>,
        value => value.result,
      );
      return result.ok ? result.value : null;
    }

    const error = await parseRentalError(response);

    if (error._tag === "ApiError" && error.code === "RETURN_SLOT_NOT_FOUND") {
      return null;
    }

    throw error;
  }
  catch {
    return null;
  }
}

export const rentalServiceV1 = {
  createRental: async (payload: CreateRentalPayload): Promise<Result<RentalWithPrice, RentalError>> => {
    try {
      const response = await kyClient.post(routePath(ServerRoutes.rentals.createRental), {
        json: payload,
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.rentals.createRental.responses[200].content["application/json"].schema;
        return decodeRentalResponse(response, okSchema as z.ZodType<RentalWithPrice>, value => value);
      }

      return err(await parseRentalError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  listMyRentals: async (params: RentalListParams = {}): Promise<Result<MyRentalListResponse, RentalError>> => {
    try {
      const response = await kyClient.get(routePath(ServerRoutes.rentals.getMyRentals), {
        searchParams: toSearchParams(params),
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.rentals.getMyRentals.responses[200].content["application/json"].schema;
        return decodeRentalResponse(response, okSchema as z.ZodType<MyRentalListResponse>, value => value);
      }

      return err(await parseRentalError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  listMyCurrentRentals: async (params: RentalListParams = {}): Promise<Result<MyRentalListResponse, RentalError>> => {
    try {
      const response = await kyClient.get(routePath(ServerRoutes.rentals.getMyCurrentRentals), {
        searchParams: toSearchParams(params),
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.rentals.getMyCurrentRentals.responses[200].content["application/json"].schema;
        return decodeRentalResponse(response, okSchema as z.ZodType<MyRentalListResponse>, value => value);
      }

      return err(await parseRentalError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  getMyRental: async (rentalId: string): Promise<Result<Rental, RentalError>> => {
    try {
      const path = routePath(ServerRoutes.rentals.getMyRental, { rentalId });

      const response = await kyClient.get(path, { throwHttpErrors: false });
      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.rentals.getMyRental.responses[200].content["application/json"].schema;
        return decodeRentalResponse(response, okSchema as z.ZodType<Rental>, value => value);
      }

      return err(await parseRentalError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  getMyRentalResolvedDetail: async (rentalId: string): Promise<Result<MyRentalResolvedDetail, RentalError>> => {
    const rentalResult = await rentalServiceV1.getMyRental(rentalId);

    if (!rentalResult.ok) {
      return rentalResult;
    }

    const rental = rentalResult.value;

    let returnSlot: ReturnSlotReservation | null = null;

    if (rental.status === "RENTED") {
      try {
        returnSlot = await tryGetCurrentReturnSlot(rentalId);
      }
      catch {
        returnSlot = null;
      }
    }

    const [bike, startStation, endStation, returnStation] = await Promise.all([
      tryGetBikeSummary(rental.bikeId),
      tryGetStationSummary(rental.startStation),
      tryGetStationSummary(rental.endStation),
      tryGetStationSummary(returnSlot?.stationId),
    ]);

    return ok({
      rental,
      bike,
      startStation,
      endStation,
      returnSlot,
      returnStation,
    });
  },

  getMyCurrentReturnSlot: async (rentalId: string): Promise<Result<ReturnSlotReservation, RentalError>> => {
    try {
      const path = routePath(ServerRoutes.rentals.getMyCurrentReturnSlot, { rentalId });

      const response = await kyClient.get(path, { throwHttpErrors: false });
      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.rentals.getMyCurrentReturnSlot.responses[200].content["application/json"].schema;
        return decodeRentalResponse(
          response,
          okSchema as z.ZodType<{ result: ReturnSlotReservation }>,
          value => value.result,
        );
      }

      return err(await parseRentalError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  createMyReturnSlot: async (
    rentalId: string,
    payload: CreateReturnSlotPayload,
  ): Promise<Result<ReturnSlotReservation, RentalError>> => {
    try {
      const path = routePath(ServerRoutes.rentals.createMyReturnSlot, { rentalId });

      const response = await kyClient.post(path, {
        json: payload,
        throwHttpErrors: false,
      });
      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.rentals.createMyReturnSlot.responses[200].content["application/json"].schema;
        return decodeRentalResponse(
          response,
          okSchema as z.ZodType<{ result: ReturnSlotReservation }>,
          value => value.result,
        );
      }

      return err(await parseRentalError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  getMyRentalCounts: async (status?: Rental["status"]): Promise<Result<RentalCounts, RentalError>> => {
    try {
      const response = await kyClient.get(routePath(ServerRoutes.rentals.getMyRentalCounts), {
        searchParams: toSearchParams(status ? { status } : undefined),
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.rentals.getMyRentalCounts.responses[200].content["application/json"].schema;
        return decodeRentalResponse(
          response,
          okSchema as z.ZodType<{ result: RentalCounts }>,
          value => value.result,
        );
      }

      return err(await parseRentalError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  getAdminRentalDetail: async (rentalId: string): Promise<Result<RentalDetail, RentalError>> => {
    try {
      const path = routePath(ServerRoutes.rentals.adminGetRental, { rentalId });

      const response = await kyClient.get(path, { throwHttpErrors: false });
      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.rentals.adminGetRental.responses[200].content["application/json"].schema;
        return decodeRentalResponse(response, okSchema as z.ZodType<RentalDetail>, value => value);
      }

      return err(await parseRentalError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  getStaffRentalDetail: async (rentalId: string): Promise<Result<RentalDetail, RentalError>> => {
    try {
      const path = routePath(ServerRoutes.rentals.staffGetRental, { rentalId });

      const response = await kyClient.get(path, { throwHttpErrors: false });
      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.rentals.staffGetRental.responses[200].content["application/json"].schema;
        return decodeRentalResponse(response, okSchema as z.ZodType<RentalDetail>, value => value);
      }

      return err(await parseRentalError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  endRentalByAdmin: async (args: {
    rentalId: string;
    endStation: string;
    reason: string;
    endTime?: string;
  }): Promise<Result<RentalWithPricing, RentalError>> => {
    try {
      const path = routePath(ServerRoutes.rentals.endRentalByAdmin, { rentalId: args.rentalId });

      const response = await kyClient.put(path, {
        json: {
          endStation: args.endStation,
          reason: args.reason,
          ...(args.endTime ? { endTime: args.endTime } : {}),
        },
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.rentals.endRentalByAdmin.responses[200].content["application/json"].schema;
        return decodeRentalResponse(response, okSchema as z.ZodType<RentalWithPricing>, value => value);
      }

      return err(await parseRentalError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  listActiveRentalsByPhone: async (args: {
    phone: string;
    page?: number;
    pageSize?: number;
  }): Promise<Result<RentalListResponse, RentalError>> => {
    try {
      const path = routePath(ServerRoutes.rentals.getActiveRentalsByPhone, { number: args.phone });

      const response = await kyClient.get(path, {
        searchParams: toSearchParams({
          page: args.page,
          pageSize: args.pageSize,
        }),
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.rentals.getActiveRentalsByPhone.responses[200].content["application/json"].schema;
        return decodeRentalResponse(response, okSchema as z.ZodType<RentalListResponse>, value => value);
      }

      return err(await parseRentalError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },
};

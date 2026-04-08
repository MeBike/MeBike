import type { Result } from "@lib/result";
import type { z } from "zod";

import { decodeWithSchema, readJson } from "@lib/api-decode";
import { kyClient } from "@lib/ky-client";
import { err, ok } from "@lib/result";
import { routePath, ServerRoutes } from "@lib/server-routes";
import { toSearchParams } from "@services/shared/search-params";
import { StatusCodes } from "http-status-codes";

import type {
  BikeSwapRequest,
  BikeSwapRequestDetail,
  BikeSwapRequestListParams,
  BikeSwapRequestListResponse,
  CreateRentalPayload,
  CreateReturnSlotPayload,
  MyBikeSwapRequestListParams,
  MyRentalListResponse,
  MyRentalResolvedDetail,
  RejectBikeSwapRequestPayload,
  Rental,
  RentalCounts,
  RentalDetail,
  RentalListParams,
  RentalListResponse,
  RentalWithPrice,
  RentalWithPricing,
  RequestBikeSwapPayload,
  ReturnSlotReservation,
} from "@/types/rental-types";

import { bikeService } from "@/services/bike.service";
import { stationService } from "@/services/station.service";

import type { RentalError } from "./rental-error";

import {
  asNetworkError,
  parseBikeSwapRequestError,
  parseRentalError,
} from "./rental-error";

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
        okSchema as z.ZodType<ReturnSlotReservation>,
        value => value,
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

  requestBikeSwap: async (
    rentalId: string,
    payload: RequestBikeSwapPayload,
  ): Promise<Result<BikeSwapRequest, RentalError>> => {
    try {
      const path = routePath(ServerRoutes.rentals.requestBikeSwap, { rentalId });

      const response = await kyClient.post(path, {
        json: payload,
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.rentals.requestBikeSwap.responses[200].content["application/json"].schema;
        return decodeRentalResponse(
          response,
          okSchema as z.ZodType<{ result: BikeSwapRequest }>,
          value => value.result,
        );
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
          okSchema as z.ZodType<ReturnSlotReservation>,
          value => value,
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
          okSchema as z.ZodType<ReturnSlotReservation>,
          value => value,
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
          okSchema as z.ZodType<RentalCounts>,
          value => value,
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

  listStaffBikeSwapRequests: async (
    params: BikeSwapRequestListParams = {},
  ): Promise<Result<BikeSwapRequestListResponse, RentalError>> => {
    try {
      const response = await kyClient.get(routePath(ServerRoutes.rentals.staffListBikeSwapRequests), {
        searchParams: toSearchParams(params),
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.rentals.staffListBikeSwapRequests.responses[200].content["application/json"].schema;
        return decodeRentalResponse(
          response,
          okSchema as z.ZodType<BikeSwapRequestListResponse>,
          value => value,
        );
      }

      return err(await parseBikeSwapRequestError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  listMyBikeSwapRequests: async (
    params: MyBikeSwapRequestListParams = {},
  ): Promise<Result<BikeSwapRequestListResponse, RentalError>> => {
    try {
      const response = await kyClient.get(routePath(ServerRoutes.rentals.getMyBikeSwapRequests), {
        searchParams: toSearchParams({
          page: params.page,
          pageSize: params.pageSize,
          rentalId: params.rentalId,
          status: params.status,
        }),
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.rentals.getMyBikeSwapRequests.responses[200].content["application/json"].schema;
        return decodeRentalResponse(
          response,
          okSchema as z.ZodType<BikeSwapRequestListResponse>,
          value => value,
        );
      }

      return err(await parseBikeSwapRequestError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  getMyBikeSwapRequest: async (
    bikeSwapRequestId: string,
  ): Promise<Result<BikeSwapRequestDetail, RentalError>> => {
    try {
      const path = routePath(ServerRoutes.rentals.getMyBikeSwapRequest, {
        bikeSwapRequestId,
      });

      const response = await kyClient.get(path, { throwHttpErrors: false });
      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.rentals.getMyBikeSwapRequest.responses[200].content["application/json"].schema;
        return decodeRentalResponse(
          response,
          okSchema as z.ZodType<{ result: BikeSwapRequestDetail }>,
          value => value.result,
        );
      }

      return err(await parseBikeSwapRequestError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  getStaffBikeSwapRequest: async (
    bikeSwapRequestId: string,
  ): Promise<Result<BikeSwapRequestDetail, RentalError>> => {
    try {
      const path = routePath(ServerRoutes.rentals.staffGetBikeSwapRequests, {
        bikeSwapRequestId,
      });

      const response = await kyClient.get(path, { throwHttpErrors: false });
      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.rentals.staffGetBikeSwapRequests.responses[200].content["application/json"].schema;
        return decodeRentalResponse(
          response,
          okSchema as z.ZodType<{ result: BikeSwapRequestDetail }>,
          value => value.result,
        );
      }

      return err(await parseBikeSwapRequestError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  approveBikeSwapRequest: async (
    bikeSwapRequestId: string,
  ): Promise<Result<BikeSwapRequestDetail, RentalError>> => {
    try {
      const path = routePath(ServerRoutes.rentals.approveBikeSwapRequest, {
        bikeSwapRequestId,
      });

      const response = await kyClient.post(path, {
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.rentals.approveBikeSwapRequest.responses[200].content["application/json"].schema;
        return decodeRentalResponse(
          response,
          okSchema as z.ZodType<{ result: BikeSwapRequestDetail }>,
          value => value.result,
        );
      }

      return err(await parseBikeSwapRequestError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  rejectBikeSwapRequest: async (
    bikeSwapRequestId: string,
    payload: RejectBikeSwapRequestPayload,
  ): Promise<Result<BikeSwapRequestDetail, RentalError>> => {
    try {
      const path = routePath(ServerRoutes.rentals.rejectBikeSwapRequest, {
        bikeSwapRequestId,
      });

      const response = await kyClient.post(path, {
        json: payload,
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.rentals.rejectBikeSwapRequest.responses[200].content["application/json"].schema;
        return decodeRentalResponse(
          response,
          okSchema as z.ZodType<{ result: BikeSwapRequestDetail }>,
          value => value.result,
        );
      }

      return err(await parseBikeSwapRequestError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  endRentalByAdmin: async (args: {
    rentalId: string;
    stationId: string;
    reason: string;
    confirmedAt?: string;
    confirmationMethod?: "MANUAL" | "QR_CODE";
  }): Promise<Result<RentalWithPricing, RentalError>> => {
    try {
      const path = routePath(ServerRoutes.rentals.endRentalByAdmin, { rentalId: args.rentalId });

      const response = await kyClient.put(path, {
        json: {
          stationId: args.stationId,
          confirmationMethod: args.confirmationMethod ?? "MANUAL",
          ...(args.confirmedAt ? { confirmedAt: args.confirmedAt } : {}),
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

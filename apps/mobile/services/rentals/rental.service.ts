import type { Result } from "@lib/result";

import { decodeWithSchema, readJson } from "@lib/api-decode";
import { kyClient } from "@lib/ky-client";
import { err, ok } from "@lib/result";
import { routePath, ServerRoutes } from "@lib/server-routes";
import { StatusCodes } from "http-status-codes";

import type {
  CreateRentalPayload,
  MyRentalListResponse,
  Rental,
  RentalCounts,
  RentalDetail,
  RentalListParams,
  RentalListResponse,
  RentalWithPrice,
  RentalWithPricing,
} from "@/types/rental-types";

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

export const rentalServiceV1 = {
  createRental: async (payload: CreateRentalPayload): Promise<Result<RentalWithPrice, RentalError>> => {
    try {
      const response = await kyClient.post(routePath(ServerRoutes.rentals.createRental), {
        json: payload,
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.rentals.createRental.responses[200].content["application/json"].schema;
        const data = await readJson(response);
        const parsed = decodeWithSchema(okSchema, data);
        return parsed.ok ? ok(parsed.value.result) : err({ _tag: "DecodeError" });
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
        const data = await readJson(response);
        const parsed = decodeWithSchema(okSchema, data);
        return parsed.ok ? ok(parsed.value) : err({ _tag: "DecodeError" });
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
        const data = await readJson(response);
        const parsed = decodeWithSchema(okSchema, data);
        return parsed.ok ? ok(parsed.value) : err({ _tag: "DecodeError" });
      }

      return err(await parseRentalError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  getMyRental: async (rentalId: string): Promise<Result<Rental, RentalError>> => {
    try {
      const path = routePath(ServerRoutes.rentals.getMyRental)
        .replace("{rentalId}", rentalId)
        .replace(":rentalId", rentalId);

      const response = await kyClient.get(path, { throwHttpErrors: false });
      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.rentals.getMyRental.responses[200].content["application/json"].schema;
        const data = await readJson(response);
        const parsed = decodeWithSchema(okSchema, data);
        return parsed.ok ? ok(parsed.value.result) : err({ _tag: "DecodeError" });
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
        const data = await readJson(response);
        const parsed = decodeWithSchema(okSchema, data);
        return parsed.ok ? ok(parsed.value.result) : err({ _tag: "DecodeError" });
      }

      return err(await parseRentalError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  endMyRental: async (args: { rentalId: string; endStation: string }): Promise<Result<Rental, RentalError>> => {
    try {
      const path = routePath(ServerRoutes.rentals.endMyRental)
        .replace("{rentalId}", args.rentalId)
        .replace(":rentalId", args.rentalId);

      const response = await kyClient.put(path, {
        json: { endStation: args.endStation },
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.rentals.endMyRental.responses[200].content["application/json"].schema;
        const data = await readJson(response);
        const parsed = decodeWithSchema(okSchema, data);
        return parsed.ok ? ok(parsed.value.result) : err({ _tag: "DecodeError" });
      }

      return err(await parseRentalError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  getAdminRentalDetail: async (rentalId: string): Promise<Result<RentalDetail, RentalError>> => {
    try {
      const path = routePath(ServerRoutes.rentals.adminGetRental)
        .replace("{rentalId}", rentalId)
        .replace(":rentalId", rentalId);

      const response = await kyClient.get(path, { throwHttpErrors: false });
      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.rentals.adminGetRental.responses[200].content["application/json"].schema;
        const data = await readJson(response);
        const parsed = decodeWithSchema(okSchema, data);
        return parsed.ok ? ok(parsed.value.result) : err({ _tag: "DecodeError" });
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
      const path = routePath(ServerRoutes.rentals.endRentalByAdmin)
        .replace("{rentalId}", args.rentalId)
        .replace(":rentalId", args.rentalId);

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
        const data = await readJson(response);
        const parsed = decodeWithSchema(okSchema, data);
        return parsed.ok ? ok(parsed.value.result) : err({ _tag: "DecodeError" });
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
      const path = routePath(ServerRoutes.rentals.getActiveRentalsByPhone)
        .replace("{number}", args.phone)
        .replace(":number", args.phone);

      const response = await kyClient.get(path, {
        searchParams: toSearchParams({
          page: args.page,
          pageSize: args.pageSize,
        }),
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.rentals.getActiveRentalsByPhone.responses[200].content["application/json"].schema;
        const data = await readJson(response);
        const parsed = decodeWithSchema(okSchema, data);
        return parsed.ok ? ok(parsed.value) : err({ _tag: "DecodeError" });
      }

      return err(await parseRentalError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },
};

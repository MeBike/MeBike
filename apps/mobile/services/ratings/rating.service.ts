import type { Result } from "@lib/result";
import type { ServerContracts } from "@mebike/shared";

import { decodeWithSchema, readJson } from "@lib/api-decode";
import { kyClient } from "@lib/ky-client";
import { err, ok } from "@lib/result";
import { routePath, ServerRoutes } from "@lib/server-routes";
import { StatusCodes } from "http-status-codes";

import type { RatingError } from "./rating-error";

import { asNetworkError, parseRatingError } from "./rating-error";

export type RatingReason = ServerContracts.RatingsContracts.RatingReason;
export type RatingDetail = ServerContracts.RatingsContracts.RatingDetail;
export type CreateRatingPayload = ServerContracts.RatingsContracts.CreateRatingRequest;

export type RatingReasonFilters = {
  type?: RatingReason["type"];
  appliesTo?: RatingReason["appliesTo"];
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

export const ratingService = {
  getRatingReasons: async (
    params?: RatingReasonFilters,
  ): Promise<Result<RatingReason[], RatingError>> => {
    try {
      const response = await kyClient.get(routePath(ServerRoutes.ratings.getReasons), {
        searchParams: toSearchParams(params),
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.ratings.getReasons.responses[200].content["application/json"].schema;
        const data = await readJson(response);
        const parsed = decodeWithSchema(okSchema, data);
        return parsed.ok ? ok(parsed.value) : err({ _tag: "DecodeError" });
      }

      return err(await parseRatingError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  getRating: async (
    rentalId: string,
  ): Promise<Result<RatingDetail | null, RatingError>> => {
    try {
      const path = routePath(ServerRoutes.ratings.getByRental, { rentalId });

      const response = await kyClient.get(path, { throwHttpErrors: false });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.ratings.getByRental.responses[200].content["application/json"].schema;
        const data = await readJson(response);
        const parsed = decodeWithSchema(okSchema, data);
        return parsed.ok ? ok(parsed.value) : err({ _tag: "DecodeError" });
      }

      const parsedError = await parseRatingError(response);
      if (parsedError._tag === "ApiError" && parsedError.code === "RENTAL_NOT_FOUND") {
        return ok(null);
      }

      return err(parsedError);
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  createRating: async (
    rentalId: string,
    payload: CreateRatingPayload,
  ): Promise<Result<RatingDetail, RatingError>> => {
    try {
      const path = routePath(ServerRoutes.ratings.create, { rentalId });

      const response = await kyClient.post(path, {
        json: payload,
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.CREATED) {
        const okSchema = ServerRoutes.ratings.create.responses[201].content["application/json"].schema;
        const data = await readJson(response);
        const parsed = decodeWithSchema(okSchema, data);
        return parsed.ok ? ok(parsed.value) : err({ _tag: "DecodeError" });
      }

      return err(await parseRatingError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },
};

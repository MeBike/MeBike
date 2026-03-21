import type { RouteHandler } from "@hono/zod-openapi";
import type { RatingsContracts } from "@mebike/shared";

import { Effect, Match } from "effect";

import { createRatingWithGuardsUseCase } from "@/domain/ratings";
import { RatingServiceTag } from "@/domain/ratings/services/rating.service";
import { withLoggedCause } from "@/domain/shared";
import { toRatingDetail, toRatingSummary } from "@/http/presenters/ratings.presenter";

import type { RatingsRoutes } from "./shared";

import {
  RatingErrorCodeSchema,
  ratingErrorMessages,
  RatingSummaryErrorCodeSchema,
  ratingSummaryErrorMessages,
  unauthorizedBody,
} from "./shared";

const create: RouteHandler<RatingsRoutes["create"]> = async (c) => {
  const userId = c.var.currentUser?.userId ?? null;
  if (!userId) {
    return c.json(unauthorizedBody, 401);
  }

  const { rentalId } = c.req.valid("param");
  const body = c.req.valid("json");

  const eff = withLoggedCause(
    createRatingWithGuardsUseCase({
      rentalId,
      userId,
      bikeScore: body.bikeScore,
      stationScore: body.stationScore,
      reasonIds: body.reasonIds,
      comment: body.comment ?? null,
    }),
    "POST /v1/ratings/{rentalId}",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<RatingsContracts.CreateRatingResponse, 201>(toRatingDetail(right), 201)),
    Match.tag("Left", ({ left }) => Match.value(left).pipe(
      Match.tag("CannotRateUncompletedRental", () =>
        c.json<RatingsContracts.RatingErrorResponse, 400>({
          error: ratingErrorMessages.RENTAL_NOT_COMPLETED,
          details: { code: RatingErrorCodeSchema.enum.RENTAL_NOT_COMPLETED },
        }, 400)),
      Match.tag("RatingExpired", () =>
        c.json<RatingsContracts.RatingErrorResponse, 400>({
          error: ratingErrorMessages.RATING_EXPIRED,
          details: { code: RatingErrorCodeSchema.enum.RATING_EXPIRED },
        }, 400)),
      Match.tag("RatingReasonNotFound", () =>
        c.json<RatingsContracts.RatingErrorResponse, 400>({
          error: ratingErrorMessages.RATING_REASON_NOT_FOUND,
          details: { code: RatingErrorCodeSchema.enum.RATING_REASON_NOT_FOUND },
        }, 400)),
      Match.tag("CannotRateOthersRental", () =>
        c.json<RatingsContracts.RatingErrorResponse, 403>({
          error: ratingErrorMessages.UNAUTHORIZED_RENTAL_ACCESS,
          details: { code: RatingErrorCodeSchema.enum.UNAUTHORIZED_RENTAL_ACCESS },
        }, 403)),
      Match.tag("RatingAlreadyExists", () =>
        c.json<RatingsContracts.RatingErrorResponse, 409>({
          error: ratingErrorMessages.RATING_ALREADY_EXISTS,
          details: { code: RatingErrorCodeSchema.enum.RATING_ALREADY_EXISTS },
        }, 409)),
      Match.tag("RentalNotFound", () =>
        c.json<RatingsContracts.RatingErrorResponse, 404>({
          error: ratingErrorMessages.RENTAL_NOT_FOUND,
          details: { code: RatingErrorCodeSchema.enum.RENTAL_NOT_FOUND },
        }, 404)),
      Match.tag("UnauthorizedRentalAccess", () =>
        c.json<RatingsContracts.RatingErrorResponse, 403>({
          error: ratingErrorMessages.UNAUTHORIZED_RENTAL_ACCESS,
          details: { code: RatingErrorCodeSchema.enum.UNAUTHORIZED_RENTAL_ACCESS },
        }, 403)),
      Match.orElse(() =>
        c.json<RatingsContracts.RatingErrorResponse, 400>({
          error: ratingErrorMessages.RENTAL_NOT_COMPLETED,
          details: { code: RatingErrorCodeSchema.enum.RENTAL_NOT_COMPLETED },
        }, 400)),
    )),
    Match.exhaustive,
  );
};

const getByRental: RouteHandler<RatingsRoutes["getByRental"]> = async (c) => {
  const { rentalId } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.flatMap(RatingServiceTag, svc => svc.getByRentalId(rentalId)),
    "GET /v1/ratings/{rentalId}",
  );

  const result = await c.var.runPromise(eff);

  if (result._tag === "None") {
    return c.json<RatingsContracts.RatingErrorResponse, 404>({
      error: "Rating not found",
      details: { code: RatingErrorCodeSchema.enum.RENTAL_NOT_FOUND },
    }, 404);
  }

  return c.json<RatingsContracts.RatingResponse, 200>(toRatingDetail(result.value), 200);
};

const getReasons: RouteHandler<RatingsRoutes["getReasons"]> = async (c) => {
  const query = c.req.valid("query");

  const eff = withLoggedCause(
    Effect.flatMap(RatingServiceTag, svc => svc.getReasons({
      type: query.type,
      appliesTo: query.appliesTo,
    })),
    "GET /v1/ratings/reasons",
  );

  const reasons = await c.var.runPromise(eff);

  return c.json<RatingsContracts.RatingReasonsResponse, 200>(
    reasons.map(reason => ({ ...reason })),
    200,
  );
};

const getBikeSummary: RouteHandler<RatingsRoutes["getBikeSummary"]> = async (c) => {
  const { bikeId } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.flatMap(RatingServiceTag, svc => svc.getBikeSummary(bikeId)),
    "GET /v1/ratings/bikes/{bikeId}/summary",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<RatingsContracts.RatingSummaryResponse, 200>(toRatingSummary(right), 200)),
    Match.tag("Left", ({ left }) => Match.value(left).pipe(
      Match.tag("BikeNotFound", () =>
        c.json<RatingsContracts.RatingSummaryErrorResponse, 404>({
          error: ratingSummaryErrorMessages.BIKE_NOT_FOUND,
          details: { code: RatingSummaryErrorCodeSchema.enum.BIKE_NOT_FOUND },
        }, 404)),
      Match.orElse((err) => {
        throw err;
      }),
    )),
    Match.exhaustive,
  );
};

const getStationSummary: RouteHandler<RatingsRoutes["getStationSummary"]> = async (c) => {
  const { stationId } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.flatMap(RatingServiceTag, svc => svc.getStationSummary(stationId)),
    "GET /v1/ratings/stations/{stationId}/summary",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<RatingsContracts.RatingSummaryResponse, 200>(toRatingSummary(right), 200)),
    Match.tag("Left", ({ left }) => Match.value(left).pipe(
      Match.tag("StationNotFound", () =>
        c.json<RatingsContracts.RatingSummaryErrorResponse, 404>({
          error: ratingSummaryErrorMessages.STATION_NOT_FOUND,
          details: { code: RatingSummaryErrorCodeSchema.enum.STATION_NOT_FOUND },
        }, 404)),
      Match.orElse((err) => {
        throw err;
      }),
    )),
    Match.exhaustive,
  );
};

export const RatingMeController = {
  create,
  getReasons,
  getBikeSummary,
  getStationSummary,
  getByRental,
} as const;

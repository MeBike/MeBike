import type { RouteHandler } from "@hono/zod-openapi";

import { Effect, Match } from "effect";

import {
  adminUpdateBikeUseCase,
  createBikeUseCase,
  softDeleteBikeUseCase,
} from "@/domain/bikes";
import { withLoggedCause } from "@/domain/shared";
import { toBikeSummary } from "@/http/presenters/bikes.presenter";

import type { BikeNotFoundResponse, BikesRoutes, BikeSummary, BikeUpdateConflictResponse } from "./shared";

import {
  BikeErrorCodeSchema,
  bikeErrorMessages,

} from "./shared";

const createBike: RouteHandler<BikesRoutes["createBike"]> = async (c) => {
  const body = c.req.valid("json");

  const eff = withLoggedCause(
    createBikeUseCase({
      chipId: body.chipId,
      stationId: body.stationId,
      supplierId: body.supplierId,
      status: body.status,
    }),
    "POST /v1/bikes",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<BikeSummary, 201>(toBikeSummary(right), 201)),
    Match.tag("Left", ({ left }) => Match.value(left).pipe(
      Match.tag("DuplicateChipId", () =>
        c.json<BikeUpdateConflictResponse, 400>({
          error: bikeErrorMessages.DUPLICATE_CHIP_ID,
          details: { code: BikeErrorCodeSchema.enum.DUPLICATE_CHIP_ID },
        }, 400)),
      Match.orElse((err) => {
        throw err;
      }),
    )),
    Match.exhaustive,
  );
};

const updateBike: RouteHandler<BikesRoutes["updateBike"]> = async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");

  const eff = adminUpdateBikeUseCase(id, {
    ...(body.chipId ? { chipId: body.chipId } : {}),
    ...(body.stationId ? { stationId: body.stationId } : {}),
    ...(body.status ? { status: body.status } : {}),
    ...(body.supplierId !== undefined ? { supplierId: body.supplierId } : {}),
  });

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      right._tag === "Some"
        ? c.json<BikeSummary, 200>(toBikeSummary(right.value), 200)
        : c.json<BikeNotFoundResponse, 404>({
            error: bikeErrorMessages.BIKE_NOT_FOUND,
            details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
          }, 404)),
    Match.tag("Left", ({ left }) => Match.value(left).pipe(
      Match.tag("BikeCurrentlyRented", () =>
        c.json<BikeUpdateConflictResponse, 400>({
          error: bikeErrorMessages.BIKE_CURRENTLY_RENTED,
          details: { code: BikeErrorCodeSchema.enum.BIKE_CURRENTLY_RENTED },
        }, 400)),
      Match.tag("BikeCurrentlyReserved", () =>
        c.json<BikeUpdateConflictResponse, 400>({
          error: bikeErrorMessages.BIKE_CURRENTLY_RESERVED,
          details: { code: BikeErrorCodeSchema.enum.BIKE_CURRENTLY_RESERVED },
        }, 400)),
      Match.tag("BikeNotFound", () =>
        c.json<BikeNotFoundResponse, 404>({
          error: bikeErrorMessages.BIKE_NOT_FOUND,
          details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
        }, 404)),
      Match.orElse(() =>
        c.json<BikeNotFoundResponse, 404>({
          error: bikeErrorMessages.BIKE_NOT_FOUND,
          details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
        }, 404)),
    )),
    Match.exhaustive,
  );
};

const deleteBike: RouteHandler<BikesRoutes["deleteBike"]> = async (c) => {
  const { id } = c.req.valid("param");

  const eff = softDeleteBikeUseCase(id);

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      right._tag === "Some"
        ? c.json<{ message: string }, 200>({ message: "Bike deleted" }, 200)
        : c.json<BikeNotFoundResponse, 404>({
            error: bikeErrorMessages.BIKE_NOT_FOUND,
            details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
          }, 404)),
    Match.tag("Left", ({ left }) => Match.value(left).pipe(
      Match.tag("BikeCurrentlyRented", () =>
        c.json<BikeUpdateConflictResponse, 400>({
          error: bikeErrorMessages.BIKE_CURRENTLY_RENTED,
          details: { code: BikeErrorCodeSchema.enum.BIKE_CURRENTLY_RENTED },
        }, 400)),
      Match.tag("BikeCurrentlyReserved", () =>
        c.json<BikeUpdateConflictResponse, 400>({
          error: bikeErrorMessages.BIKE_CURRENTLY_RESERVED,
          details: { code: BikeErrorCodeSchema.enum.BIKE_CURRENTLY_RESERVED },
        }, 400)),
      Match.tag("BikeNotFound", () =>
        c.json<BikeNotFoundResponse, 404>({
          error: bikeErrorMessages.BIKE_NOT_FOUND,
          details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
        }, 404)),
      Match.orElse(() =>
        c.json<BikeNotFoundResponse, 404>({
          error: bikeErrorMessages.BIKE_NOT_FOUND,
          details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
        }, 404)),
    )),
    Match.exhaustive,
  );
};

export const BikeAdminController = {
  createBike,
  updateBike,
  deleteBike,
} as const;

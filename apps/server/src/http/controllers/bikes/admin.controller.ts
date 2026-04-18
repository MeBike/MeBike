import type { RouteHandler } from "@hono/zod-openapi";

import { Effect, Match, Option } from "effect";

import {
  BikeServiceTag,
  softDeleteBikeUseCase,
} from "@/domain/bikes";
import { withLoggedCause } from "@/domain/shared";
import { pickDefined } from "@/domain/shared/pick-defined";

import type { BikeNotFoundResponse, BikesRoutes, BikeSummary, BikeUpdateConflictResponse } from "./shared";

import {
  BikeErrorCodeSchema,
  bikeErrorMessages,
  loadBikeSummary,

} from "./shared";

const createBike: RouteHandler<BikesRoutes["createBike"]> = async (c) => {
  const body = c.req.valid("json");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* BikeServiceTag;
      const bike = yield* service.createBike({
        stationId: body.stationId,
        supplierId: body.supplierId,
        status: body.status,
      });

      return yield* loadBikeSummary(bike);
    }),
    "POST /v1/bikes",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<BikeSummary, 201>(right, 201)),
    Match.tag("Left", ({ left }) => Match.value(left).pipe(
      Match.tag("BikeStationNotFound", ({ stationId }) =>
        c.json<BikeUpdateConflictResponse, 400>({
          error: bikeErrorMessages.BIKE_STATION_NOT_FOUND,
          details: {
            code: BikeErrorCodeSchema.enum.BIKE_STATION_NOT_FOUND,
            stationId,
          },
        }, 400)),
      Match.tag("BikeSupplierNotFound", ({ supplierId }) =>
        c.json<BikeUpdateConflictResponse, 400>({
          error: bikeErrorMessages.BIKE_SUPPLIER_NOT_FOUND,
          details: {
            code: BikeErrorCodeSchema.enum.BIKE_SUPPLIER_NOT_FOUND,
            supplierId,
          },
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

  const eff = Effect.gen(function* () {
    const service = yield* BikeServiceTag;
    const bike = yield* service.adminUpdateBike(id, pickDefined(body));

    if (Option.isNone(bike)) {
      return Option.none<BikeSummary>();
    }

    const summary = yield* loadBikeSummary(bike.value);
    return Option.some(summary);
  });

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      right._tag === "Some"
        ? c.json<BikeSummary, 200>(right.value, 200)
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
      Match.tag("BikeStationNotFound", ({ stationId }) =>
        c.json<BikeUpdateConflictResponse, 400>({
          error: bikeErrorMessages.BIKE_STATION_NOT_FOUND,
          details: {
            code: BikeErrorCodeSchema.enum.BIKE_STATION_NOT_FOUND,
            stationId,
          },
        }, 400)),
      Match.tag("BikeSupplierNotFound", ({ supplierId }) =>
        c.json<BikeUpdateConflictResponse, 400>({
          error: bikeErrorMessages.BIKE_SUPPLIER_NOT_FOUND,
          details: {
            code: BikeErrorCodeSchema.enum.BIKE_SUPPLIER_NOT_FOUND,
            supplierId,
          },
        }, 400)),
      Match.orElse((err) => {
        throw err;
      }),
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

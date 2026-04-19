import type { RouteHandler } from "@hono/zod-openapi";

import { Effect, Match } from "effect";

import { BikeServiceTag } from "@/domain/bikes";
import { withLoggedCause } from "@/domain/shared";

import type { BikeNotFoundResponse, BikesRoutes, BikeSummary, BikeUpdateConflictResponse } from "./shared";

import {
  BikeErrorCodeSchema,
  bikeErrorMessages,
  loadBikeSummary,
} from "./shared";

function notFoundResponse(bikeId: string): BikeNotFoundResponse {
  return {
    error: bikeErrorMessages.BIKE_NOT_FOUND,
    details: {
      code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND,
      bikeId,
    },
  };
}

function invalidStatusResponse(status: string): BikeUpdateConflictResponse {
  return {
    error: bikeErrorMessages.INVALID_BIKE_STATUS,
    details: {
      code: BikeErrorCodeSchema.enum.INVALID_BIKE_STATUS,
      status,
    },
  };
}

const managerUpdateBikeStatus: RouteHandler<BikesRoutes["managerUpdateBikeStatus"]> = async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const stationId = c.var.currentUser?.operatorStationId;

  if (!stationId) {
    return c.json<BikeNotFoundResponse, 404>(notFoundResponse(id), 404);
  }

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* BikeServiceTag;
      const bike = yield* service.updateBikeStatusInStationScope(id, {
        stationId,
        status: body.status,
      });

      return yield* loadBikeSummary(bike);
    }),
    "PATCH /v1/manager/bikes/{id}/status",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<BikeSummary, 200>(right, 200)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("BikeNotFound", ({ id: bikeId }) =>
          c.json<BikeNotFoundResponse, 404>(notFoundResponse(bikeId), 404)),
        Match.tag("InvalidBikeStatus", ({ status }) =>
          c.json<BikeUpdateConflictResponse, 400>(invalidStatusResponse(status), 400)),
        Match.orElse((err) => {
          throw err;
        }),
      )),
    Match.exhaustive,
  );
};

const agencyUpdateBikeStatus: RouteHandler<BikesRoutes["agencyUpdateBikeStatus"]> = async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const stationId = c.var.currentUser?.operatorStationId;

  if (!stationId) {
    return c.json<BikeNotFoundResponse, 404>(notFoundResponse(id), 404);
  }

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* BikeServiceTag;
      const bike = yield* service.updateBikeStatusInStationScope(id, {
        stationId,
        status: body.status,
      });

      return yield* loadBikeSummary(bike);
    }),
    "PATCH /v1/agency/bikes/{id}/status",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<BikeSummary, 200>(right, 200)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("BikeNotFound", ({ id: bikeId }) =>
          c.json<BikeNotFoundResponse, 404>(notFoundResponse(bikeId), 404)),
        Match.tag("InvalidBikeStatus", ({ status }) =>
          c.json<BikeUpdateConflictResponse, 400>(invalidStatusResponse(status), 400)),
        Match.orElse((err) => {
          throw err;
        }),
      )),
    Match.exhaustive,
  );
};

export const BikeManagementController = {
  managerUpdateBikeStatus,
  agencyUpdateBikeStatus,
} as const;

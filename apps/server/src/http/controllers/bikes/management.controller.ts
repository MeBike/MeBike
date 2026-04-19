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

async function runScopedBikeStatusUpdate(args: {
  id: string;
  status: "AVAILABLE" | "BROKEN";
  stationId: string | undefined;
  context: string;
  runPromise: <A, E, R>(effect: Effect.Effect<A, E, R>) => Promise<A>;
}) {
  const { id, status, stationId, context } = args;

  if (!stationId) {
    return {
      _tag: "NotFound" as const,
      response: notFoundResponse(id),
    };
  }

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* BikeServiceTag;
      const bike = yield* service.updateBikeStatusInStationScope(id, {
        stationId,
        status,
      });

      return yield* loadBikeSummary(bike);
    }),
    context,
  );

  const result = await args.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => ({
      _tag: "Success" as const,
      response: right,
    })),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("BikeNotFound", ({ id: bikeId }) => ({
          _tag: "NotFound" as const,
          response: notFoundResponse(bikeId),
        })),
        Match.tag("InvalidBikeStatus", ({ status: invalidStatus }) => ({
          _tag: "InvalidStatus" as const,
          response: invalidStatusResponse(invalidStatus),
        })),
        Match.orElse((err) => {
          throw err;
        }),
      )),
    Match.exhaustive,
  );
}

const managerUpdateBikeStatus: RouteHandler<BikesRoutes["managerUpdateBikeStatus"]> = async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const result = await runScopedBikeStatusUpdate({
    id,
    status: body.status,
    stationId: c.var.currentUser?.operatorStationId,
    context: "PATCH /v1/manager/bikes/{id}/status",
    runPromise: c.var.runPromise,
  });

  if (result._tag === "Success") {
    return c.json<BikeSummary, 200>(result.response, 200);
  }

  if (result._tag === "InvalidStatus") {
    return c.json<BikeUpdateConflictResponse, 400>(result.response, 400);
  }

  return c.json<BikeNotFoundResponse, 404>(result.response, 404);
};

const agencyUpdateBikeStatus: RouteHandler<BikesRoutes["agencyUpdateBikeStatus"]> = async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const result = await runScopedBikeStatusUpdate({
    id,
    status: body.status,
    stationId: c.var.currentUser?.operatorStationId,
    context: "PATCH /v1/agency/bikes/{id}/status",
    runPromise: c.var.runPromise,
  });

  if (result._tag === "Success") {
    return c.json<BikeSummary, 200>(result.response, 200);
  }

  if (result._tag === "InvalidStatus") {
    return c.json<BikeUpdateConflictResponse, 400>(result.response, 400);
  }

  return c.json<BikeNotFoundResponse, 404>(result.response, 404);
};

const technicianUpdateBikeStatus: RouteHandler<BikesRoutes["technicianUpdateBikeStatus"]> = async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const result = await runScopedBikeStatusUpdate({
    id,
    status: body.status,
    stationId: c.var.currentUser?.operatorStationId,
    context: "PATCH /v1/technician/bikes/{id}/status",
    runPromise: c.var.runPromise,
  });

  if (result._tag === "Success") {
    return c.json<BikeSummary, 200>(result.response, 200);
  }

  if (result._tag === "InvalidStatus") {
    return c.json<BikeUpdateConflictResponse, 400>(result.response, 400);
  }

  return c.json<BikeNotFoundResponse, 404>(result.response, 404);
};

export const BikeManagementController = {
  managerUpdateBikeStatus,
  agencyUpdateBikeStatus,
  technicianUpdateBikeStatus,
} as const;

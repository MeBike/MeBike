import type { RouteHandler } from "@hono/zod-openapi";

import { Effect, Match } from "effect";

import { withLoggedCause } from "@/domain/shared";
import { StationQueryServiceTag } from "@/domain/stations";
import { toContractStationRevenue } from "@/http/presenters/stations.presenter";

import type {
  StationErrorResponse,
  StationRevenueResponse,
  StationsRoutes,
} from "./shared";

import {
  resolveStationRevenueRange,
  StationErrorCodeSchema,
  stationErrorMessages,
} from "./shared";

function getManagerStationScope(currentUser: {
  role: string;
  operatorStationId?: string;
}) {
  if (currentUser.role === "MANAGER") {
    return currentUser.operatorStationId ?? null;
  }

  return undefined;
}

const managerGetAssignedStationRevenue: RouteHandler<
  StationsRoutes["managerGetAssignedStationRevenue"]
> = async (c) => {
  const query = c.req.valid("query");
  const stationScopeId = getManagerStationScope(c.var.currentUser!);

  if (!stationScopeId) {
    return c.json<StationErrorResponse, 404>({
      error: stationErrorMessages.STATION_NOT_FOUND,
      details: {
        code: StationErrorCodeSchema.enum.STATION_NOT_FOUND,
      },
    }, 404);
  }
  const rangeResult = resolveStationRevenueRange(query);

  if (!rangeResult.ok) {
    return c.json<StationErrorResponse, 400>(rangeResult.error, 400);
  }

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* StationQueryServiceTag;
      return yield* service.getRevenueForStation({
        stationId: stationScopeId,
        ...rangeResult.range,
        groupBy: rangeResult.groupBy,
      });
    }),
    "GET /v1/manager/stations/revenue",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<StationRevenueResponse, 200>(toContractStationRevenue(right), 200)),
    Match.tag("Left", () =>
      c.json<StationErrorResponse, 404>({
        error: stationErrorMessages.STATION_NOT_FOUND,
        details: {
          code: StationErrorCodeSchema.enum.STATION_NOT_FOUND,
          stationId: stationScopeId,
        },
      }, 404)),
    Match.exhaustive,
  );
};

export const StationManagerController = {
  managerGetAssignedStationRevenue,
} as const;

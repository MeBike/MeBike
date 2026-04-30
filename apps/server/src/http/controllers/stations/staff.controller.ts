import type { RouteHandler } from "@hono/zod-openapi";

import { Effect, Match } from "effect";

import { withLoggedCause } from "@/domain/shared";
import { StationQueryServiceTag } from "@/domain/stations";
import { toContractStationReadSummary } from "@/http/presenters/stations.presenter";

import type {
  StationErrorResponse,
  StationListResponse,
  StationReadSummary,
  StationsRoutes,
} from "./shared";

import { StationErrorCodeSchema, stationErrorMessages } from "./shared";

const staffListStations: RouteHandler<StationsRoutes["staffListStations"]> = async (c) => {
  const query = c.req.valid("query");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* StationQueryServiceTag;

      return yield* service.listStations(
        {
          name: query.name,
          address: query.address,
          stationType: query.stationType,
          agencyId: query.agencyId,
          totalCapacity: query.totalCapacity,
        },
        {
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 50,
          sortBy: query.sortBy ?? "name",
          sortDir: query.sortDir ?? "asc",
        },
      );
    }),
    "GET /v1/staff/stations",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<StationListResponse, 200>({
        data: right.items.map(toContractStationReadSummary),
        pagination: {
          page: right.page,
          pageSize: right.pageSize,
          total: right.total,
          totalPages: right.totalPages,
        },
      }, 200)),
    Match.tag("Left", () =>
      c.json<StationErrorResponse, 400>({
        error: stationErrorMessages.INVALID_QUERY_PARAMS,
        details: {
          code: StationErrorCodeSchema.enum.INVALID_QUERY_PARAMS,
        },
      }, 400)),
    Match.exhaustive,
  );
};

const staffGetStation: RouteHandler<StationsRoutes["staffGetStation"]> = async (c) => {
  const { stationId } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* StationQueryServiceTag;
      return yield* service.getStationById(stationId);
    }),
    `GET /v1/staff/stations/${stationId}`,
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => c.json<StationReadSummary, 200>(toContractStationReadSummary(right), 200)),
    Match.tag("Left", () =>
      c.json<StationErrorResponse, 404>({
        error: stationErrorMessages.STATION_NOT_FOUND,
        details: {
          code: StationErrorCodeSchema.enum.STATION_NOT_FOUND,
          stationId,
        },
      }, 404)),
    Match.exhaustive,
  );
};

export const StationStaffController = {
  staffListStations,
  staffGetStation,
} as const;

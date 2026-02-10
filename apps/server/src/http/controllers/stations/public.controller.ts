import type { RouteHandler } from "@hono/zod-openapi";

import { Effect, Match } from "effect";

import { withLoggedCause } from "@/domain/shared";
import { StationServiceTag } from "@/domain/stations";

import type {
  StationErrorResponse,
  StationListResponse,
  StationsRoutes,
  StationSummary,
} from "./shared";

import { StationErrorCodeSchema, stationErrorMessages } from "./shared";

const listStations: RouteHandler<StationsRoutes["listStations"]> = async (c) => {
  const query = c.req.valid("query");
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* StationServiceTag;
      return yield* service.listStations(
        {
          name: query.name,
          address: query.address,
          capacity: query.capacity,
        },
        {
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 50,
          sortBy: query.sortBy ?? "name",
          sortDir: query.sortDir ?? "asc",
        },
      );
    }),
    "GET /v1/stations",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<StationListResponse, 200>({
        data: right.items,
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
        details: { code: StationErrorCodeSchema.enum.INVALID_QUERY_PARAMS },
      }, 400)),
    Match.exhaustive,
  );
};

const getNearbyStations: RouteHandler<StationsRoutes["getNearbyStations"]> = async (c) => {
  const query = c.req.valid("query");
  if (!Number.isFinite(query.latitude) || !Number.isFinite(query.longitude)) {
    return c.json<StationErrorResponse, 400>({
      error: stationErrorMessages.INVALID_COORDINATES,
      details: { code: StationErrorCodeSchema.enum.INVALID_COORDINATES },
    }, 400);
  }

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* StationServiceTag;
      return yield* service.listNearestStations({
        latitude: query.latitude,
        longitude: query.longitude,
        maxDistanceMeters: query.maxDistance,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 50,
      });
    }),
    "GET /v1/stations/nearby",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<StationListResponse, 200>({
        data: right.items,
        pagination: {
          page: right.page,
          pageSize: right.pageSize,
          total: right.total,
          totalPages: right.totalPages,
        },
      }, 200)),
    Match.tag("Left", () =>
      c.json<StationErrorResponse, 400>({
        error: stationErrorMessages.INVALID_COORDINATES,
        details: { code: StationErrorCodeSchema.enum.INVALID_COORDINATES },
      }, 400)),
    Match.exhaustive,
  );
};

const getStation: RouteHandler<StationsRoutes["getStation"]> = async (c) => {
  const { stationId } = c.req.valid("param");
  const eff = Effect.gen(function* () {
    const service = yield* StationServiceTag;
    return yield* service.getStationById(stationId);
  });

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => c.json<StationSummary, 200>(right, 200)),
    Match.tag("Left", ({ left }) =>
      left._tag === "StationNotFound"
        ? c.json<StationErrorResponse, 404>({
            error: stationErrorMessages.STATION_NOT_FOUND,
            details: {
              code: StationErrorCodeSchema.enum.STATION_NOT_FOUND,
              stationId,
            },
          }, 404)
        : c.json<StationErrorResponse, 404>({
            error: stationErrorMessages.STATION_NOT_FOUND,
            details: { code: StationErrorCodeSchema.enum.STATION_NOT_FOUND },
          }, 404)),
    Match.exhaustive,
  );
};

export const StationPublicController = {
  listStations,
  getNearbyStations,
  getStation,
} as const;

import type { RouteHandler } from "@hono/zod-openapi";

import { Effect, Match } from "effect";

import { previousUtcMonthFullRange } from "@/domain/rentals/services/queries/rental-stats-time";
import { withLoggedCause } from "@/domain/shared";
import { StationQueryServiceTag } from "@/domain/stations";
import {
  toContractNearbyStation,
  toContractStationReadSummary,
  toContractStationRevenue,
} from "@/http/presenters/stations.presenter";

import type {
  StationErrorResponse,
  StationListResponse,
  StationReadSummary,
  StationRevenueResponse,
  StationsRoutes,
} from "./shared";

import { StationErrorCodeSchema, stationErrorMessages } from "./shared";

const listStations: RouteHandler<StationsRoutes["listStations"]> = async (c) => {
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
    "GET /v1/stations",
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
      const service = yield* StationQueryServiceTag;
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
        data: right.items.map(toContractNearbyStation),
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
    const service = yield* StationQueryServiceTag;
    return yield* service.getStationById(stationId);
  });

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => c.json<StationReadSummary, 200>(toContractStationReadSummary(right), 200)),
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

const getAllStationsRevenue: RouteHandler<StationsRoutes["getAllStationsRevenue"]> = async (c) => {
  const query = c.req.valid("query");

  const from = query.from ? new Date(query.from) : null;
  const to = query.to ? new Date(query.to) : null;

  if ((from && !to) || (!from && to)) {
    return c.json<StationErrorResponse, 400>({
      error: stationErrorMessages.INVALID_DATE_RANGE,
      details: {
        code: StationErrorCodeSchema.enum.INVALID_DATE_RANGE,
        from: query.from,
        to: query.to,
      },
    }, 400);
  }

  const range = from && to ? { from, to } : previousUtcMonthFullRange(new Date());

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* StationQueryServiceTag;
      return yield* service.getRevenueByStation(range);
    }),
    "GET /v1/stations/revenue",
  );

  const result = await c.var.runPromise(eff);
  return c.json<StationRevenueResponse, 200>(toContractStationRevenue(result), 200);
};

export const StationPublicController = {
  listStations,
  getNearbyStations,
  getStation,
  getAllStationsRevenue,
} as const;

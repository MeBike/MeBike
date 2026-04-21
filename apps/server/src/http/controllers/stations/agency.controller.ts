import type { RouteHandler } from "@hono/zod-openapi";

import { Effect, Match } from "effect";

import { previousUtcMonthFullRange } from "@/domain/rentals/services/queries/rental-stats-time";
import { withLoggedCause } from "@/domain/shared";
import { StationQueryServiceTag } from "@/domain/stations";
import {
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

function getAgencyStationScope(currentUser: {
  role: string;
  operatorStationId?: string;
}) {
  if (currentUser.role === "AGENCY") {
    return currentUser.operatorStationId ?? null;
  }

  return undefined;
}

const agencyListStations: RouteHandler<StationsRoutes["agencyListStations"]> = async (c) => {
  const query = c.req.valid("query");
  const stationScopeId = getAgencyStationScope(c.var.currentUser!);

  if (stationScopeId === null) {
    return c.json<StationListResponse, 200>({
      data: [],
      pagination: {
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 50,
        total: 0,
        totalPages: 0,
      },
    }, 200);
  }

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* StationQueryServiceTag;

      const page = yield* service.listStations(
        {
          id: stationScopeId!,
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

      if (page.total > 0) {
        return page;
      }

      yield* service.getStationById(stationScopeId!);

      return page;
    }),
    "GET /v1/agency/stations",
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
      c.json<StationErrorResponse, 404>({
        error: stationErrorMessages.STATION_NOT_FOUND,
        details: {
          code: StationErrorCodeSchema.enum.STATION_NOT_FOUND,
          stationId: stationScopeId!,
        },
      }, 404)),
    Match.exhaustive,
  );
};

const agencyGetStation: RouteHandler<StationsRoutes["agencyGetStation"]> = async (c) => {
  const { stationId } = c.req.valid("param");
  const stationScopeId = getAgencyStationScope(c.var.currentUser!);

  if (stationScopeId === null || stationId !== stationScopeId) {
    return c.json<StationErrorResponse, 404>({
      error: stationErrorMessages.STATION_NOT_FOUND,
      details: {
        code: StationErrorCodeSchema.enum.STATION_NOT_FOUND,
        stationId,
      },
    }, 404);
  }

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* StationQueryServiceTag;
      return yield* service.getStationById(stationId);
    }),
    `GET /v1/agency/stations/${stationId}`,
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

const agencyGetAssignedStationRevenue: RouteHandler<StationsRoutes["agencyGetAssignedStationRevenue"]> = async (c) => {
  const query = c.req.valid("query");
  const stationScopeId = getAgencyStationScope(c.var.currentUser!);

  if (!stationScopeId) {
    return c.json<StationErrorResponse, 404>({
      error: stationErrorMessages.STATION_NOT_FOUND,
      details: {
        code: StationErrorCodeSchema.enum.STATION_NOT_FOUND,
      },
    }, 404);
  }

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
      return yield* service.getRevenueForStation({
          stationId: stationScopeId,
          ...range,
        });
    }),
    "GET /v1/agency/stations/revenue",
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

export const StationAgencyController = {
  agencyListStations,
  agencyGetStation,
  agencyGetAssignedStationRevenue,
} as const;

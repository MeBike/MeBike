import type { RouteHandler } from "@hono/zod-openapi";
import type { StationsContracts } from "@mebike/shared";

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

type StationListQuery = StationsContracts.StationListQuery;

function getStationScopedRoleScope(currentUser: {
  role: string;
  operatorStationId?: string;
}) {
  if (
    currentUser.role === "STAFF"
    || currentUser.role === "MANAGER"
    || currentUser.role === "TECHNICIAN"
  ) {
    return currentUser.operatorStationId ?? null;
  }

  return undefined;
}

function matchesStationFilters(
  station: { name: string; address: string; stationType: string; agencyId: string | null; totalCapacity: number },
  query: StationListQuery,
) {
  if (query.name && !station.name.toLowerCase().includes(query.name.toLowerCase())) {
    return false;
  }

  if (query.address && !station.address.toLowerCase().includes(query.address.toLowerCase())) {
    return false;
  }

  if (query.stationType && station.stationType !== query.stationType) {
    return false;
  }

  if (query.agencyId && station.agencyId !== query.agencyId) {
    return false;
  }

  if (typeof query.totalCapacity === "number" && station.totalCapacity !== query.totalCapacity) {
    return false;
  }

  return true;
}

const staffListStations: RouteHandler<StationsRoutes["staffListStations"]> = async (c) => {
  const query = c.req.valid("query");
  const stationScopeId = getStationScopedRoleScope(c.var.currentUser!);

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
      const station = yield* service.getStationById(stationScopeId!);

      return matchesStationFilters(station, query) ? [station] : [];
    }),
    "GET /v1/staff/stations",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => {
      const total = right.length;
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 50;
      const data = page === 1 && total > 0 ? right.map(toContractStationReadSummary) : [];

      return c.json<StationListResponse, 200>({
        data,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
        },
      }, 200);
    }),
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

const staffGetStation: RouteHandler<StationsRoutes["staffGetStation"]> = async (c) => {
  const { stationId } = c.req.valid("param");
  const stationScopeId = getStationScopedRoleScope(c.var.currentUser!);

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

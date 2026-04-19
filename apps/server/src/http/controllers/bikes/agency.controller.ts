import type { RouteHandler } from "@hono/zod-openapi";

import { Effect, Match, Option } from "effect";

import { BikeServiceTag } from "@/domain/bikes";
import { withLoggedCause } from "@/domain/shared";

import type { BikeListResponse, BikeNotFoundResponse, BikesRoutes, BikeSummary } from "./shared";

import {
  BikeErrorCodeSchema,
  bikeErrorMessages,
  loadBikeSummaries,
  loadBikeSummary,
} from "./shared";

function getAgencyStationScope(currentUser: {
  role: string;
  operatorStationId?: string;
}) {
  if (currentUser.role === "AGENCY") {
    return currentUser.operatorStationId ?? null;
  }

  return undefined;
}

const agencyListBikes: RouteHandler<BikesRoutes["agencyListBikes"]> = async (c) => {
  const query = c.req.valid("query");
  const stationScopeId = getAgencyStationScope(c.var.currentUser!);

  if (stationScopeId === null) {
    return c.json<BikeListResponse, 200>({
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
      const service = yield* BikeServiceTag;
      const page = yield* service.listBikes(
        {
          id: query.id,
          stationId: stationScopeId ?? query.stationId,
          supplierId: query.supplierId,
          status: query.status,
        },
        {
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 50,
          sortBy: query.sortBy ?? "status",
          sortDir: query.sortDir ?? "asc",
        },
      );

      const data = yield* loadBikeSummaries(page.items);
      return { page, data };
    }),
    "GET /v1/agency/bikes",
  );

  const value = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(value).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<BikeListResponse, 200>({
        data: right.data,
        pagination: {
          page: right.page.page,
          pageSize: right.page.pageSize,
          total: right.page.total,
          totalPages: right.page.totalPages,
        },
      }, 200)),
    Match.tag("Left", () =>
      c.json({
        error: bikeErrorMessages.INVALID_QUERY_PARAMS,
        details: { code: BikeErrorCodeSchema.enum.INVALID_QUERY_PARAMS },
      }, 400)),
    Match.exhaustive,
  );
};

const agencyGetBike: RouteHandler<BikesRoutes["agencyGetBike"]> = async (c) => {
  const { id } = c.req.valid("param");
  const stationScopeId = getAgencyStationScope(c.var.currentUser!);

  if (stationScopeId === null) {
    return c.json<BikeNotFoundResponse, 404>({
      error: bikeErrorMessages.BIKE_NOT_FOUND,
      details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
    }, 404);
  }

  const eff = Effect.gen(function* () {
    const service = yield* BikeServiceTag;
    const bike = yield* service.getBikeDetail(id);

    if (Option.isNone(bike)) {
      return Option.none<BikeSummary>();
    }

    if (stationScopeId && bike.value.stationId !== stationScopeId) {
      return Option.none<BikeSummary>();
    }

    const summary = yield* loadBikeSummary(bike.value);
    return Option.some(summary);
  });

  const value = await c.var.runPromise(withLoggedCause(eff, `GET /v1/agency/bikes/${id}`));
  return Option.isSome(value)
    ? c.json<BikeSummary, 200>(value.value, 200)
    : c.json<BikeNotFoundResponse, 404>({
        error: bikeErrorMessages.BIKE_NOT_FOUND,
        details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
      }, 404);
};

export const BikeAgencyController = {
  agencyListBikes,
  agencyGetBike,
} as const;

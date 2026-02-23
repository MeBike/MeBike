import type { RouteHandler } from "@hono/zod-openapi";

import { Effect, Match } from "effect";

import { BikeStatsServiceTag } from "@/domain/bikes";
import { withLoggedCause } from "@/domain/shared";
import {
  toBikeActivityStats,
  toBikeRentalHistoryItem,
  toBikeRentalStats,
  toHighestRevenueBike,
} from "@/http/presenters/bikes.presenter";

import type { BikeActivityStatsResponse, BikeNotFoundResponse, BikeRentalHistoryResponse, BikeRentalStatsResponse, BikesRoutes, HighestRevenueBikeResponse } from "./shared";

import {

  BikeErrorCodeSchema,
  bikeErrorMessages,

} from "./shared";

const getBikeStats: RouteHandler<BikesRoutes["getBikeStats"]> = async (c) => {
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const svc = yield* BikeStatsServiceTag;
      return yield* svc.getRentalStats();
    }),
    "GET /v1/bikes/stats/summary",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<BikeRentalStatsResponse, 200>(toBikeRentalStats(right), 200)),
    Match.tag("Left", ({ left }) => {
      throw left;
    }),
    Match.exhaustive,
  );
};

const getHighestRevenueBike: RouteHandler<BikesRoutes["getHighestRevenueBike"]> = async (c) => {
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const svc = yield* BikeStatsServiceTag;
      return yield* svc.getHighestRevenueBike();
    }),
    "GET /v1/bikes/stats/highest-revenue",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<HighestRevenueBikeResponse, 200>(right ? toHighestRevenueBike(right) : null, 200)),
    Match.tag("Left", ({ left }) => {
      throw left;
    }),
    Match.exhaustive,
  );
};

const getBikeActivityStats: RouteHandler<BikesRoutes["getBikeActivityStats"]> = async (c) => {
  const { id } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const svc = yield* BikeStatsServiceTag;
      return yield* svc.getBikeActivityStats({ bikeId: id });
    }),
    "GET /v1/bikes/{id}/activity-stats",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<BikeActivityStatsResponse, 200>(toBikeActivityStats(right), 200)),
    Match.tag("Left", ({ left }) => Match.value(left).pipe(
      Match.tag("BikeNotFound", () =>
        c.json<BikeNotFoundResponse, 404>({
          error: bikeErrorMessages.BIKE_NOT_FOUND,
          details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
        }, 404)),
      Match.orElse((err) => {
        throw err;
      }),
    )),
    Match.exhaustive,
  );
};

const getBikeRentalHistory: RouteHandler<BikesRoutes["getBikeRentalHistory"]> = async (c) => {
  const { id } = c.req.valid("param");
  const query = c.req.valid("query");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const svc = yield* BikeStatsServiceTag;
      return yield* svc.getBikeRentalHistory(id, {
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 50,
        sortBy: query.sortBy ?? "endTime",
        sortDir: query.sortDir ?? "desc",
      });
    }),
    "GET /v1/bikes/{id}/rental-history",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<BikeRentalHistoryResponse, 200>({
        data: right.items.map(toBikeRentalHistoryItem),
        pagination: {
          page: right.page,
          pageSize: right.pageSize,
          total: right.total,
          totalPages: right.totalPages,
        },
      }, 200)),
    Match.tag("Left", ({ left }) => Match.value(left).pipe(
      Match.tag("BikeNotFound", () =>
        c.json<BikeNotFoundResponse, 404>({
          error: bikeErrorMessages.BIKE_NOT_FOUND,
          details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
        }, 404)),
      Match.orElse((err) => {
        throw err;
      }),
    )),
    Match.exhaustive,
  );
};

export const BikeStatsController = {
  getBikeStats,
  getHighestRevenueBike,
  getBikeActivityStats,
  getBikeRentalHistory,
} as const;

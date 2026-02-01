import type { RouteHandler } from "@hono/zod-openapi";

import { Effect, Match } from "effect";

import {
  BikeServiceTag,
} from "@/domain/bikes";
import { withLoggedCause } from "@/domain/shared";
import { toBikeSummary } from "@/http/presenters/bikes.presenter";

import type { BikeListResponse, BikeNotFoundResponse, BikesRoutes, BikeSummary } from "./shared";

import {
  BikeErrorCodeSchema,
  bikeErrorMessages,

} from "./shared";

const listBikes: RouteHandler<BikesRoutes["listBikes"]> = async (c) => {
  const query = c.req.valid("query");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* BikeServiceTag;
      return yield* service.listBikes(
        {
          id: query.id,
          stationId: query.stationId,
          supplierId: query.supplierId,
          status: query.status,
        },
        {
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 50,
          sortBy: (query.sortBy) ?? "status",
          sortDir: query.sortDir ?? "asc",
        },
      );
    }),
    "GET /v1/bikes",
  );

  const value = await c.var.runPromise(eff);
  return c.json<BikeListResponse, 200>(
    {
      data: value.items.map(toBikeSummary),
      pagination: {
        page: value.page,
        pageSize: value.pageSize,
        total: value.total,
        totalPages: value.totalPages,
      },
    },
    200,
  );
};

const getBike: RouteHandler<BikesRoutes["getBike"]> = async (c) => {
  const { id } = c.req.valid("param");

  const eff = Effect.gen(function* () {
    const service = yield* BikeServiceTag;
    return yield* service.getBikeDetail(id);
  });

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      right._tag === "Some"
        ? c.json<BikeSummary, 200>(toBikeSummary(right.value), 200)
        : c.json<BikeNotFoundResponse, 404>({
            error: bikeErrorMessages.BIKE_NOT_FOUND,
            details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
          }, 404)),
    Match.tag("Left", () =>
      c.json<BikeNotFoundResponse, 404>({
        error: bikeErrorMessages.BIKE_NOT_FOUND,
        details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
      }, 404)),
    Match.exhaustive,
  );
};

const reportBrokenBike: RouteHandler<BikesRoutes["reportBrokenBike"]> = async (c) => {
  const { id } = c.req.valid("param");

  const eff = Effect.gen(function* () {
    const service = yield* BikeServiceTag;
    return yield* service.reportBrokenBike(id);
  });

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      right._tag === "Some"
        ? c.json<BikeSummary, 200>(toBikeSummary(right.value), 200)
        : c.json<BikeNotFoundResponse, 404>({
            error: bikeErrorMessages.BIKE_NOT_FOUND,
            details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
          }, 404)),
    Match.tag("Left", ({ left }) => {
      throw left;
    }),
    Match.exhaustive,
  );
};

export const BikePublicController = {
  listBikes,
  getBike,
  reportBrokenBike,
} as const;

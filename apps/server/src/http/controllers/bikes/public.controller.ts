import type { RouteHandler } from "@hono/zod-openapi";

import { Effect, Option } from "effect";

import {
  BikeServiceTag,
} from "@/domain/bikes";
import { withLoggedCause } from "@/domain/shared";

import type { BikeListResponse, BikeNotFoundResponse, BikesRoutes, BikeSummary } from "./shared";

import {
  BikeErrorCodeSchema,
  bikeErrorMessages,
  loadBikeSummaries,
  loadBikeSummary,

} from "./shared";

const listBikes: RouteHandler<BikesRoutes["listBikes"]> = async (c) => {
  const query = c.req.valid("query");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* BikeServiceTag;
      const page = yield* service.listBikes(
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

      const data = yield* loadBikeSummaries(page.items);
      return { page, data };
    }),
    "GET /v1/bikes",
  );

  const value = await c.var.runPromise(eff);
  return c.json<BikeListResponse, 200>(
    {
      data: value.data,
      pagination: {
        page: value.page.page,
        pageSize: value.page.pageSize,
        total: value.page.total,
        totalPages: value.page.totalPages,
      },
    },
    200,
  );
};

const getBike: RouteHandler<BikesRoutes["getBike"]> = async (c) => {
  const { id } = c.req.valid("param");

  const eff = Effect.gen(function* () {
    const service = yield* BikeServiceTag;
    const bike = yield* service.getBikeDetail(id);

    if (Option.isNone(bike)) {
      return Option.none<BikeSummary>();
    }

    const summary = yield* loadBikeSummary(bike.value);
    return Option.some(summary);
  });

  const value = await c.var.runPromise(withLoggedCause(eff, `GET /v1/bikes/${id}`));
  return Option.isSome(value)
    ? c.json<BikeSummary, 200>(value.value, 200)
    : c.json<BikeNotFoundResponse, 404>({
        error: bikeErrorMessages.BIKE_NOT_FOUND,
        details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
      }, 404);
};

const reportBrokenBike: RouteHandler<BikesRoutes["reportBrokenBike"]> = async (c) => {
  const { id } = c.req.valid("param");

  const eff = Effect.gen(function* () {
    const service = yield* BikeServiceTag;
    const bike = yield* service.reportBrokenBike(id);

    if (Option.isNone(bike)) {
      return Option.none<BikeSummary>();
    }

    const summary = yield* loadBikeSummary(bike.value);
    return Option.some(summary);
  });

  const value = await c.var.runPromise(withLoggedCause(eff, `PATCH /v1/bikes/report-broken/${id}`));
  return Option.isSome(value)
    ? c.json<BikeSummary, 200>(value.value, 200)
    : c.json<BikeNotFoundResponse, 404>({
        error: bikeErrorMessages.BIKE_NOT_FOUND,
        details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
      }, 404);
};

export const BikePublicController = {
  listBikes,
  getBike,
  reportBrokenBike,
} as const;

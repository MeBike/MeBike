import { BikesContracts, serverRoutes } from "@mebike/shared";
import { Effect, Match } from "effect";

import {
  adminUpdateBikeUseCase,
  BikeRepositoryLive,
  BikeServiceLive,
  getBikeDetailUseCase,
  listBikesUseCase,
  reportBrokenBikeUseCase,
  softDeleteBikeUseCase,
} from "@/domain/bikes";
import { Prisma } from "@/infrastructure/prisma";

type BikeSummary = BikesContracts.BikeSummary;
type BikeNotFoundResponse = BikesContracts.BikeNotFoundResponse;
type BikeUpdateConflictResponse = BikesContracts.BikeUpdateConflictResponse;
// type BikeReportForbiddenResponse = BikesContracts.BikeReportForbiddenResponse;

const { BikeErrorCodeSchema, bikeErrorMessages } = BikesContracts;

type BikeListResponse = {
  data: BikeSummary[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export function registerBikeRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const bikes = serverRoutes.bikes;
  const toBikeSummary = (row: import("@/domain/bikes").BikeRow): BikeSummary => ({
    id: row.id,
    chipId: row.chipId,
    stationId: row.stationId,
    supplierId: row.supplierId,
    status: row.status,
  });

  app.openapi(bikes.listBikes, async (c) => {
    const query = c.req.valid("query");

    const eff = listBikesUseCase({
      filter: {
        id: query.id,
        stationId: query.station_id,
        supplierId: query.supplier_id,
        status: query.status,
      },
      pageReq: {
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 50,
        sortBy: (query.sortBy) ?? "status",
        sortDir: query.sortDir ?? "asc",
      },
    }).pipe(
      Effect.provide(BikeServiceLive),
      Effect.provide(BikeRepositoryLive),
      Effect.provide(Prisma.Default),
    );

    const value = await Effect.runPromise(eff);
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
  });

  app.openapi(bikes.getBike, async (c) => {
    const { id } = c.req.valid("param");

    const eff = getBikeDetailUseCase(id).pipe(
      Effect.provide(BikeServiceLive),
      Effect.provide(BikeRepositoryLive),
      Effect.provide(Prisma.Default),
    );

    const result = await Effect.runPromise(eff.pipe(Effect.either));
    if (result._tag === "Right") {
      const value = result.right;
      return value._tag === "Some"
        ? c.json<BikeSummary, 200>(toBikeSummary(value.value), 200)
        : c.json<BikeNotFoundResponse, 404>(
            {
              error: bikeErrorMessages.BIKE_NOT_FOUND,
              details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
            },
            404,
          );
    }
    return c.json<BikeNotFoundResponse, 404>(
      {
        error: bikeErrorMessages.BIKE_NOT_FOUND,
        details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
      },
      404,
    );
  });

  app.openapi(bikes.updateBike, async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const eff = adminUpdateBikeUseCase(id, {
      ...(body.chip_id ? { chipId: body.chip_id } : {}),
      ...(body.station_id ? { stationId: body.station_id } : {}),
      ...(body.status ? { status: body.status } : {}),
      ...(body.supplier_id !== undefined ? { supplierId: body.supplier_id } : {}),
    }).pipe(
      Effect.provide(BikeServiceLive),
      Effect.provide(BikeRepositoryLive),
      Effect.provide(Prisma.Default),
    );

    const result = await Effect.runPromise(eff.pipe(Effect.either));
    if (result._tag === "Right") {
      const value = result.right;
      return value._tag === "Some"
        ? c.json<BikeSummary, 200>(toBikeSummary(value.value), 200)
        : c.json<BikeNotFoundResponse, 404>(
            {
              error: bikeErrorMessages.BIKE_NOT_FOUND,
              details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
            },
            404,
          );
    }

    return Match.value(result.left).pipe(
      Match.tag("BikeCurrentlyRented", () =>
        c.json<BikeUpdateConflictResponse, 400>(
          {
            error: bikeErrorMessages.BIKE_CURRENTLY_RENTED,
            details: { code: BikeErrorCodeSchema.enum.BIKE_CURRENTLY_RENTED },
          },
          400,
        )),
      Match.tag("BikeCurrentlyReserved", () =>
        c.json<BikeUpdateConflictResponse, 400>(
          {
            error: bikeErrorMessages.BIKE_CURRENTLY_RESERVED,
            details: { code: BikeErrorCodeSchema.enum.BIKE_CURRENTLY_RESERVED },
          },
          400,
        )),
      Match.tag("BikeNotFound", () =>
        c.json<BikeNotFoundResponse, 404>(
          {
            error: bikeErrorMessages.BIKE_NOT_FOUND,
            details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
          },
          404,
        )),
      Match.orElse(() =>
        c.json<BikeNotFoundResponse, 404>(
          {
            error: bikeErrorMessages.BIKE_NOT_FOUND,
            details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
          },
          404,
        ),
      ),
    );
  });

  app.openapi(bikes.reportBrokenBike, async (c) => {
    const { id } = c.req.valid("param");

    const eff = reportBrokenBikeUseCase(id).pipe(
      Effect.provide(BikeServiceLive),
      Effect.provide(BikeRepositoryLive),
      Effect.provide(Prisma.Default),
    );

    const result = await Effect.runPromise(eff.pipe(Effect.either));
    if (result._tag === "Right") {
      const value = result.right;
      return value._tag === "Some"
        ? c.json<BikeSummary, 200>(toBikeSummary(value.value), 200)
        : c.json<BikeNotFoundResponse, 404>(
            {
              error: bikeErrorMessages.BIKE_NOT_FOUND,
              details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
            },
            404,
          );
    }

    // No domain failures are expected today; bubble infrastructure errors.
    throw result.left;
  });

  app.openapi(bikes.deleteBike, async (c) => {
    const { id } = c.req.valid("param");

    const eff = softDeleteBikeUseCase(id).pipe(
      Effect.provide(BikeServiceLive),
      Effect.provide(BikeRepositoryLive),
      Effect.provide(Prisma.Default),
    );

    const result = await Effect.runPromise(eff.pipe(Effect.either));
    if (result._tag === "Right") {
      const value = result.right;
      return value._tag === "Some"
        ? c.json<{ message: string }, 200>({ message: "Bike deleted" }, 200)
        : c.json<BikeNotFoundResponse, 404>(
            {
              error: bikeErrorMessages.BIKE_NOT_FOUND,
              details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
            },
            404,
          );
    }

    return Match.value(result.left).pipe(
      Match.tag("BikeCurrentlyRented", () =>
        c.json<BikeUpdateConflictResponse, 400>(
          {
            error: bikeErrorMessages.BIKE_CURRENTLY_RENTED,
            details: { code: BikeErrorCodeSchema.enum.BIKE_CURRENTLY_RENTED },
          },
          400,
        )),
      Match.tag("BikeCurrentlyReserved", () =>
        c.json<BikeUpdateConflictResponse, 400>(
          {
            error: bikeErrorMessages.BIKE_CURRENTLY_RESERVED,
            details: { code: BikeErrorCodeSchema.enum.BIKE_CURRENTLY_RESERVED },
          },
          400,
        )),
      Match.tag("BikeNotFound", () =>
        c.json<BikeNotFoundResponse, 404>(
          {
            error: bikeErrorMessages.BIKE_NOT_FOUND,
            details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
          },
          404,
        )),
      Match.orElse(() =>
        c.json<BikeNotFoundResponse, 404>(
          {
            error: bikeErrorMessages.BIKE_NOT_FOUND,
            details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
          },
          404,
        ),
      ),
    );
  });

  // TODO: implement analytics endpoints (rental history, activity stats, stats summary, highest revenue)
}

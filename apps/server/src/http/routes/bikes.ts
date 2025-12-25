import { BikesContracts, serverRoutes } from "@mebike/shared";
import { Effect, Match } from "effect";

import {
  adminUpdateBikeUseCase,
  getBikeDetailUseCase,
  listBikesUseCase,
  reportBrokenBikeUseCase,
  softDeleteBikeUseCase,
} from "@/domain/bikes";
import { withLoggedCause } from "@/domain/shared";
import { withBikeDeps } from "@/http/shared/providers";

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

    const eff = withLoggedCause(
      withBikeDeps(
        listBikesUseCase({
          filter: {
            id: query.id,
            stationId: query.stationId,
            supplierId: query.supplierId,
            status: query.status,
          },
          pageReq: {
            page: query.page ?? 1,
            pageSize: query.pageSize ?? 50,
            sortBy: (query.sortBy) ?? "status",
            sortDir: query.sortDir ?? "asc",
          },
        }),
      ),
      "GET /v1/bikes",
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

    const eff = withBikeDeps(getBikeDetailUseCase(id));

    const result = await Effect.runPromise(eff.pipe(Effect.either));
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
  });

  app.openapi(bikes.updateBike, async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const eff = withBikeDeps(
      adminUpdateBikeUseCase(id, {
        ...(body.chipId ? { chipId: body.chipId } : {}),
        ...(body.stationId ? { stationId: body.stationId } : {}),
        ...(body.status ? { status: body.status } : {}),
        ...(body.supplierId !== undefined ? { supplierId: body.supplierId } : {}),
      }),
    );

    const result = await Effect.runPromise(eff.pipe(Effect.either));
    return Match.value(result).pipe(
      Match.tag("Right", ({ right }) =>
        right._tag === "Some"
          ? c.json<BikeSummary, 200>(toBikeSummary(right.value), 200)
          : c.json<BikeNotFoundResponse, 404>({
              error: bikeErrorMessages.BIKE_NOT_FOUND,
              details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
            }, 404)),
      Match.tag("Left", ({ left }) => Match.value(left).pipe(
        Match.tag("BikeCurrentlyRented", () =>
          c.json<BikeUpdateConflictResponse, 400>({
            error: bikeErrorMessages.BIKE_CURRENTLY_RENTED,
            details: { code: BikeErrorCodeSchema.enum.BIKE_CURRENTLY_RENTED },
          }, 400)),
        Match.tag("BikeCurrentlyReserved", () =>
          c.json<BikeUpdateConflictResponse, 400>({
            error: bikeErrorMessages.BIKE_CURRENTLY_RESERVED,
            details: { code: BikeErrorCodeSchema.enum.BIKE_CURRENTLY_RESERVED },
          }, 400)),
        Match.tag("BikeNotFound", () =>
          c.json<BikeNotFoundResponse, 404>({
            error: bikeErrorMessages.BIKE_NOT_FOUND,
            details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
          }, 404)),
        Match.orElse(() =>
          c.json<BikeNotFoundResponse, 404>({
            error: bikeErrorMessages.BIKE_NOT_FOUND,
            details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
          }, 404)),
      )),
      Match.exhaustive,
    );
  });

  app.openapi(bikes.reportBrokenBike, async (c) => {
    const { id } = c.req.valid("param");

    const eff = withBikeDeps(reportBrokenBikeUseCase(id));

    const result = await Effect.runPromise(eff.pipe(Effect.either));
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
  });

  app.openapi(bikes.deleteBike, async (c) => {
    const { id } = c.req.valid("param");

    const eff = withBikeDeps(softDeleteBikeUseCase(id));

    const result = await Effect.runPromise(eff.pipe(Effect.either));
    return Match.value(result).pipe(
      Match.tag("Right", ({ right }) =>
        right._tag === "Some"
          ? c.json<{ message: string }, 200>({ message: "Bike deleted" }, 200)
          : c.json<BikeNotFoundResponse, 404>({
              error: bikeErrorMessages.BIKE_NOT_FOUND,
              details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
            }, 404)),
      Match.tag("Left", ({ left }) => Match.value(left).pipe(
        Match.tag("BikeCurrentlyRented", () =>
          c.json<BikeUpdateConflictResponse, 400>({
            error: bikeErrorMessages.BIKE_CURRENTLY_RENTED,
            details: { code: BikeErrorCodeSchema.enum.BIKE_CURRENTLY_RENTED },
          }, 400)),
        Match.tag("BikeCurrentlyReserved", () =>
          c.json<BikeUpdateConflictResponse, 400>({
            error: bikeErrorMessages.BIKE_CURRENTLY_RESERVED,
            details: { code: BikeErrorCodeSchema.enum.BIKE_CURRENTLY_RESERVED },
          }, 400)),
        Match.tag("BikeNotFound", () =>
          c.json<BikeNotFoundResponse, 404>({
            error: bikeErrorMessages.BIKE_NOT_FOUND,
            details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
          }, 404)),
        Match.orElse(() =>
          c.json<BikeNotFoundResponse, 404>({
            error: bikeErrorMessages.BIKE_NOT_FOUND,
            details: { code: BikeErrorCodeSchema.enum.BIKE_NOT_FOUND },
          }, 404)),
      )),
      Match.exhaustive,
    );
  });

  // TODO: implement analytics endpoints (rental history, activity stats, stats summary, highest revenue)
}

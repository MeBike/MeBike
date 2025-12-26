import { serverRoutes, StationsContracts } from "@mebike/shared";
import { Effect } from "effect";

import { withLoggedCause } from "@/domain/shared";
import {
  getStationDetailsUseCase,
  listNearestStationsUseCase,
  listStationsUseCase,
  StationRepositoryLive,
  StationServiceLive,
} from "@/domain/stations";
import { PrismaLive } from "@/infrastructure/prisma";

export function registerStationRoutes(
  app: import("@hono/zod-openapi").OpenAPIHono,
) {
  const stations = serverRoutes.stations;

  app.openapi(stations.listStations, async (c) => {
    const query = c.req.valid("query");
    const eff = withLoggedCause(
      listStationsUseCase({
        filter: {
          name: query.name,
          address: query.address,
          capacity: query.capacity,
        },
        pageReq: {
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 50,
          sortBy: query.sortBy ?? "name",
          sortDir: query.sortDir ?? "asc",
        },
      }).pipe(
        Effect.provide(StationServiceLive),
        Effect.provide(StationRepositoryLive),
        Effect.provide(PrismaLive),
      ),
      "GET /v1/stations",
    );

    return Effect.runPromise(
      eff.pipe(
        Effect.matchEffect({
          onSuccess: value =>
            Effect.sync(() =>
              c.json<StationsContracts.StationListResponse, 200>(
                {
                  data: value.items,
                  pagination: {
                    page: value.page,
                    pageSize: value.pageSize,
                    total: value.total,
                    totalPages: value.totalPages,
                  },
                },
                200,
              ),
            ),
          onFailure: () =>
            Effect.sync(() =>
              c.json<StationsContracts.StationErrorResponse, 400>(
                {
                  error:
                    StationsContracts.stationErrorMessages.INVALID_QUERY_PARAMS,
                  details: {
                    code: StationsContracts.StationErrorCodeSchema.enum
                      .INVALID_QUERY_PARAMS,
                  },
                },
                400,
              ),
            ),
        }),
      ),
    );
  });

  app.openapi(stations.getNearbyStations, async (c) => {
    const query = c.req.valid("query");
    if (!Number.isFinite(query.latitude) || !Number.isFinite(query.longitude)) {
      return c.json<StationsContracts.StationErrorResponse, 400>(
        {
          error: StationsContracts.stationErrorMessages.INVALID_COORDINATES,
          details: {
            code: StationsContracts.StationErrorCodeSchema.enum
              .INVALID_COORDINATES,
          },
        },
        400,
      );
    }

    const eff = listNearestStationsUseCase({
      latitude: query.latitude,
      longitude: query.longitude,
      maxDistanceMeters: query.maxDistance,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 50,
    })
      .pipe(
        Effect.provide(StationServiceLive),
        Effect.provide(StationRepositoryLive),
        Effect.provide(PrismaLive),
      )
      .pipe(effect => withLoggedCause(effect, "GET /v1/stations/nearby"));

    return Effect.runPromise(
      eff.pipe(
        Effect.matchEffect({
          onSuccess: value =>
            Effect.sync(() =>
              c.json<StationsContracts.StationListResponse, 200>(
                {
                  data: value.items,
                  pagination: {
                    page: value.page,
                    pageSize: value.pageSize,
                    total: value.total,
                    totalPages: value.totalPages,
                  },
                },
                200,
              ),
            ),
          onFailure: () =>
            Effect.sync(() =>
              c.json<StationsContracts.StationErrorResponse, 400>(
                {
                  error:
                    StationsContracts.stationErrorMessages.INVALID_COORDINATES,
                  details: {
                    code: StationsContracts.StationErrorCodeSchema.enum
                      .INVALID_COORDINATES,
                  },
                },
                400,
              ),
            ),
        }),
      ),
    );
  });

  app.openapi(stations.getStation, async (c) => {
    const { stationId } = c.req.valid("param");
    const eff = getStationDetailsUseCase(stationId).pipe(
      Effect.provide(StationServiceLive),
      Effect.provide(StationRepositoryLive),
      Effect.provide(PrismaLive),
    );

    return Effect.runPromise(
      eff.pipe(
        Effect.matchEffect({
          onSuccess: value =>
            Effect.sync(() =>
              c.json<StationsContracts.StationSummary, 200>(value, 200),
            ),
          onFailure: error =>
            error._tag === "StationNotFound"
              ? Effect.sync(() =>
                  c.json<StationsContracts.StationErrorResponse, 404>(
                    {
                      error:
                        StationsContracts.stationErrorMessages
                          .STATION_NOT_FOUND,
                      details: {
                        code: StationsContracts.StationErrorCodeSchema.enum
                          .STATION_NOT_FOUND,
                        stationId,
                      },
                    },
                    404,
                  ),
                )
              : Effect.sync(() =>
                  c.json<StationsContracts.StationErrorResponse, 404>(
                    {
                      error:
                        StationsContracts.stationErrorMessages
                          .STATION_NOT_FOUND,
                      details: {
                        code: StationsContracts.StationErrorCodeSchema.enum
                          .STATION_NOT_FOUND,
                      },
                    },
                    404,
                  ),
                ),
        }),
      ),
    );
  });
}

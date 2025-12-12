import type { StationErrorResponse, StationSummary } from "@mebike/shared";

import {
  serverRoutes,
  StationErrorCodeSchema,
  stationErrorMessages,
} from "@mebike/shared";
import { Effect } from "effect";

import {
  getStationDetailsUseCase,
  listNearestStationsUseCase,
  listStationsUseCase,
  StationRepositoryLive,
  StationServiceLive,
} from "@/domain/stations";
import { Prisma } from "@/infrastructure/prisma";

type StationListResponse = {
  data: StationSummary[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export function registerStationRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const stations = serverRoutes.stations;

  // Register static paths before parameterized ones to avoid /nearby being captured by /:stationId
  app.openapi(stations.listStations, async (c) => {
    const query = c.req.valid("query");
    const eff = listStationsUseCase({
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
      Effect.provide(Prisma.Default),
    );

    return Effect.runPromise(
      eff.pipe(
        Effect.matchEffect({
          onSuccess: value =>
            Effect.sync(() =>
              c.json<StationListResponse, 200>(
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
              c.json<StationErrorResponse, 400>(
                {
                  error: stationErrorMessages.INVALID_QUERY_PARAMS,
                  details: {
                    code: StationErrorCodeSchema.enum.INVALID_QUERY_PARAMS,
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
      return c.json<StationErrorResponse, 400>(
        {
          error: stationErrorMessages.INVALID_COORDINATES,
          details: { code: StationErrorCodeSchema.enum.INVALID_COORDINATES },
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
    }).pipe(
      Effect.provide(StationServiceLive),
      Effect.provide(StationRepositoryLive),
      Effect.provide(Prisma.Default),
    );

    return Effect.runPromise(
      eff.pipe(
        Effect.matchEffect({
          onSuccess: value =>
            Effect.sync(() =>
              c.json<StationListResponse, 200>(
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
              c.json<StationErrorResponse, 400>(
                {
                  error: stationErrorMessages.INVALID_COORDINATES,
                  details: {
                    code: StationErrorCodeSchema.enum.INVALID_COORDINATES,
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
      Effect.provide(Prisma.Default),
    );

    return Effect.runPromise(
      eff.pipe(
        Effect.matchEffect({
          onSuccess: value =>
            Effect.sync(() =>
              c.json<StationSummary, 200>(value, 200),
            ),
          onFailure: error =>
            error._tag === "StationNotFound"
              ? Effect.sync(() =>
                  c.json<StationErrorResponse, 404>(
                    {
                      error: stationErrorMessages.STATION_NOT_FOUND,
                      details: {
                        code: StationErrorCodeSchema.enum.STATION_NOT_FOUND,
                        stationId,
                      },
                    },
                    404,
                  ),
                )
              : Effect.sync(() =>
                  c.json<StationErrorResponse, 404>(
                    {
                      error: stationErrorMessages.STATION_NOT_FOUND,
                      details: {
                        code: StationErrorCodeSchema.enum.STATION_NOT_FOUND,
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

import type { MapiResponse } from "@mapbox/mapbox-sdk/lib/classes/mapi-response";
import type {
  DirectionsRequest,
  DirectionsResponse,
} from "@mapbox/mapbox-sdk/services/directions";
import type { MatrixRequest, MatrixResponse } from "@mapbox/mapbox-sdk/services/matrix";

import directionsSdk from "@mapbox/mapbox-sdk/services/directions";
import matrixSdk from "@mapbox/mapbox-sdk/services/matrix";
import { Effect, Layer } from "effect";

import { env } from "@/config/env";
import { Redis } from "@/infrastructure/redis";

import type {
  MapboxCoordinate,
  MapboxMatrixEntry,
  MapboxMatrixRequest,
  MapboxRouteGeometryFormat,
  MapboxRoutePath,
  MapboxRouteRequest,
  MapboxRoutingProfile,
  MapboxRoutingService,
  MatrixCachePayload,
} from "./types";

import {
  MapboxRoutingInitError,
  MapboxRoutingRateLimitError,
  MapboxRoutingRequestError,
  MapboxRoutingResponseError,
} from "./errors";
import {
  buildMatrixCacheKey,
  buildRouteCacheKey,
  cacheTtlSecondsForProfile,
  hasValidCoordinates,
  toSdkCoordinate,
} from "./routing.helpers";

type DirectionsClient = ReturnType<typeof directionsSdk>;
type MatrixClient = ReturnType<typeof matrixSdk>;

type RedisLike = import("ioredis").default;

function mapRequestError(
  operation: "getRoute" | "getMatrix",
  cause: unknown,
): MapboxRoutingRequestError | MapboxRoutingRateLimitError {
  const statusCode = typeof cause === "object" && cause !== null && "statusCode" in cause
    ? Number((cause as { statusCode?: unknown }).statusCode)
    : null;

  if (statusCode === 429) {
    return new MapboxRoutingRateLimitError({
      operation,
      message: "Mapbox rate limit exceeded.",
      cause,
    });
  }

  return new MapboxRoutingRequestError({
    operation,
    message: `Mapbox ${operation} request failed.`,
    cause,
  });
}

function readCachedJson<T>(redis: RedisLike, key: string) {
  return Effect.promise(() => redis.get(key)).pipe(
    Effect.catchAll(() => Effect.succeed(null)),
    Effect.map((cached) => {
      if (!cached) {
        return null;
      }

      try {
        return JSON.parse(cached) as T;
      }
      catch {
        return null;
      }
    }),
  );
}

function writeCachedJson(redis: RedisLike, key: string, value: unknown, ttlSeconds: number) {
  return Effect.promise(() => redis.set(key, JSON.stringify(value), "EX", ttlSeconds)).pipe(
    Effect.catchAll(() => Effect.void),
    Effect.asVoid,
  );
}

function toDirectionsClients(): {
  directionsClient: DirectionsClient;
  matrixClient: MatrixClient;
} | null {
  const accessToken = env.MAPBOX_ACCESS_TOKEN;

  if (!accessToken) {
    return null;
  }

  return {
    directionsClient: directionsSdk({ accessToken }),
    matrixClient: matrixSdk({ accessToken }),
  };
}

function validateCoordinates(operation: "getRoute" | "getMatrix", coordinates: ReadonlyArray<MapboxCoordinate>) {
  return coordinates.every(hasValidCoordinates)
    ? Effect.void
    : Effect.fail(new MapboxRoutingRequestError({
        operation,
        message: "Mapbox routing requires finite latitude and longitude values.",
      }));
}

function getMapboxClients() {
  const clients = toDirectionsClients();

  return clients
    ? Effect.succeed(clients)
    : Effect.fail(new MapboxRoutingInitError({
        message: "MAPBOX_ACCESS_TOKEN is required to use Mapbox routing.",
      }));
}

function normalizeRouteResponse(
  body: DirectionsResponse<string | GeoJSON.LineString | GeoJSON.MultiLineString>,
  geometryFormat: MapboxRouteGeometryFormat,
): Effect.Effect<MapboxRoutePath, MapboxRoutingResponseError> {
  const route = body.routes[0];

  if (!route) {
    return Effect.fail(new MapboxRoutingResponseError({
      operation: "getRoute",
      message: "Mapbox returned no route candidates.",
      body,
    }));
  }

  return Effect.succeed({
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    geometryFormat,
    geometry: route.geometry,
  });
}

function normalizeMatrixResponse(body: MatrixResponse): Effect.Effect<ReadonlyArray<MapboxMatrixEntry>, MapboxRoutingResponseError> {
  const durations = body.durations as Array<Array<number | null | undefined>> | undefined;
  const distances = body.distances as Array<Array<number | null | undefined>> | undefined;
  const durationRow = durations?.[0];
  const distanceRow = distances?.[0];

  if (!durationRow && !distanceRow) {
    return Effect.fail(new MapboxRoutingResponseError({
      operation: "getMatrix",
      message: "Mapbox returned no matrix distance or duration rows.",
      body,
    }));
  }

  const result = body.destinations.map((_, destinationIndex) => ({
    destinationIndex,
    distanceMeters: distanceRow?.[destinationIndex] ?? null,
    durationSeconds: durationRow?.[destinationIndex] ?? null,
  } satisfies MapboxMatrixEntry));

  return Effect.succeed(result);
}

function fetchRouteFromMapbox(args: {
  directionsClient: DirectionsClient;
  origin: MapboxCoordinate;
  destination: MapboxCoordinate;
  profile: MapboxRoutingProfile;
  geometryFormat: MapboxRouteGeometryFormat;
}) {
  const waypoints = [
    { coordinates: toSdkCoordinate(args.origin) },
    { coordinates: toSdkCoordinate(args.destination) },
  ];

  if (args.geometryFormat === "geojson") {
    const request: DirectionsRequest<"geojson"> = {
      profile: args.profile,
      waypoints,
      geometries: "geojson",
      overview: "full",
      steps: false,
    };

    return Effect.tryPromise({
      try: () => args.directionsClient.getDirections(request).send() as Promise<MapiResponse<DirectionsResponse<GeoJSON.LineString | GeoJSON.MultiLineString>>>,
      catch: cause => mapRequestError("getRoute", cause),
    }).pipe(
      Effect.flatMap(response => normalizeRouteResponse(response.body, args.geometryFormat)),
    );
  }

  const request: DirectionsRequest<"polyline6"> = {
    profile: args.profile,
    waypoints,
    geometries: "polyline6",
    overview: "full",
    steps: false,
  };

  return Effect.tryPromise({
    try: () => args.directionsClient.getDirections(request).send() as Promise<MapiResponse<DirectionsResponse<string>>>,
    catch: cause => mapRequestError("getRoute", cause),
  }).pipe(
    Effect.flatMap(response => normalizeRouteResponse(response.body, args.geometryFormat)),
  );
}

function fetchMatrixFromMapbox(args: {
  matrixClient: MatrixClient;
  origin: MapboxCoordinate;
  destinations: ReadonlyArray<MapboxCoordinate>;
  profile: MapboxRoutingProfile;
}) {
  const request: MatrixRequest = {
    profile: args.profile,
    points: [args.origin, ...args.destinations].map(coordinate => ({
      coordinates: toSdkCoordinate(coordinate),
    })),
    sources: [0],
    destinations: args.destinations.map((_, index) => index + 1),
    annotations: ["distance", "duration"],
  };

  return Effect.tryPromise({
    try: () => args.matrixClient.getMatrix(request).send() as Promise<MapiResponse<MatrixResponse>>,
    catch: cause => mapRequestError("getMatrix", cause),
  }).pipe(
    Effect.flatMap(response => normalizeMatrixResponse(response.body)),
  );
}

const makeMapboxRouting = Effect.gen(function* () {
  const { client: redis } = yield* Redis;

  return {
    getRoute: (args: MapboxRouteRequest) =>
      Effect.gen(function* () {
        yield* validateCoordinates("getRoute", [args.origin, args.destination]);

        const geometryFormat = args.geometryFormat ?? "polyline6";
        const cacheKey = buildRouteCacheKey({
          origin: args.origin,
          destination: args.destination,
          profile: args.profile,
          geometryFormat,
        });

        const cached = yield* readCachedJson<MapboxRoutePath>(redis, cacheKey);
        if (cached) {
          return cached;
        }

        const { directionsClient } = yield* getMapboxClients();
        const route = yield* fetchRouteFromMapbox({
          directionsClient,
          origin: args.origin,
          destination: args.destination,
          profile: args.profile,
          geometryFormat,
        });

        yield* writeCachedJson(redis, cacheKey, route, cacheTtlSecondsForProfile(args.profile));
        return route;
      }),

    getMatrix: (args: MapboxMatrixRequest) =>
      Effect.gen(function* () {
        yield* validateCoordinates("getMatrix", [args.origin, ...args.destinations]);

        if (args.destinations.length === 0) {
          return [];
        }

        const cacheKey = buildMatrixCacheKey(args);
        const cached = yield* readCachedJson<MatrixCachePayload>(redis, cacheKey);
        if (cached) {
          return cached.entries;
        }

        const { matrixClient } = yield* getMapboxClients();
        const entries = yield* fetchMatrixFromMapbox({
          matrixClient,
          origin: args.origin,
          destinations: args.destinations,
          profile: args.profile,
        });

        yield* writeCachedJson(redis, cacheKey, { entries }, cacheTtlSecondsForProfile(args.profile));
        return entries;
      }),
  } satisfies MapboxRoutingService;
});

export class MapboxRouting extends Effect.Service<MapboxRouting>()("MapboxRouting", {
  effect: makeMapboxRouting,
}) {}

export const MapboxRoutingLive = Layer.effect(
  MapboxRouting,
  makeMapboxRouting.pipe(Effect.map(MapboxRouting.make)),
);

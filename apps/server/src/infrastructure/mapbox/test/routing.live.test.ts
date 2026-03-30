import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";

import { MapboxRouting, MapboxRoutingLive } from "@/infrastructure/mapbox";
import { Redis } from "@/infrastructure/redis";
import { runEffectWithLayer } from "@/test/effect/run";

import type { MapboxCoordinate } from "../types";

class InMemoryRedisClient {
  readonly store = new Map<string, string>();

  async get(key: string) {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string) {
    this.store.set(key, value);
    return "OK" as const;
  }

  async quit() {
    return "OK" as const;
  }
}

const liveIt = process.env.MAPBOX_ACCESS_TOKEN ? it : it.skip;

// Real downtown HCMC landmarks chosen to be close to seeded stations:
// - Ben Thanh Market is near `Ga Bến Thành` in `prisma/seed/stations.data.ts`
// - Saigon Opera House is near `Ga Nhà hát Thành phố`
// - Saigon Central Post Office is also in the same downtown cluster
// - Independence Palace is another well-known landmark near the Q1 station area
const origin: MapboxCoordinate = {
  latitude: 10.77252069383567,
  longitude: 106.69801917744711,
};

const destination: MapboxCoordinate = {
  latitude: 10.7767,
  longitude: 106.7032194,
};

const matrixDestinations: ReadonlyArray<MapboxCoordinate> = [
  destination,
  {
    latitude: 10.78,
    longitude: 106.7,
  },
  {
    latitude: 10.77694,
    longitude: 106.69528,
  },
];

function makeLiveLayer(redisClient: InMemoryRedisClient) {
  const redisLayer = Layer.succeed(
    Redis,
    Redis.make({
      client: redisClient as unknown as import("ioredis").default,
    }),
  );

  return MapboxRoutingLive.pipe(Layer.provide(redisLayer));
}

describe("mapbox routing live smoke", () => {
  liveIt("calls real Directions API and stores the normalized route in cache", async () => {
    const redisClient = new InMemoryRedisClient();

    const route = await runEffectWithLayer(
      Effect.gen(function* () {
        const routing = yield* MapboxRouting;
        return yield* routing.getRoute({
          origin,
          destination,
          profile: "cycling",
          geometryFormat: "polyline6",
        });
      }),
      makeLiveLayer(redisClient),
    );

    expect(route.distanceMeters).toBeGreaterThan(0);
    expect(route.durationSeconds).toBeGreaterThan(0);
    expect(route.geometryFormat).toBe("polyline6");
    expect(typeof route.geometry).toBe("string");
    expect(redisClient.store.size).toBe(1);

    const cachedPayload = JSON.parse([...redisClient.store.values()][0] ?? "null") as {
      distanceMeters?: number;
      durationSeconds?: number;
    } | null;

    expect(cachedPayload?.distanceMeters).toBe(route.distanceMeters);
    expect(cachedPayload?.durationSeconds).toBe(route.durationSeconds);
  });

  liveIt("calls real Matrix API and stores ordered destination metrics in cache", async () => {
    const redisClient = new InMemoryRedisClient();

    const entries = await runEffectWithLayer(
      Effect.gen(function* () {
        const routing = yield* MapboxRouting;
        return yield* routing.getMatrix({
          origin,
          destinations: matrixDestinations,
          profile: "cycling",
        });
      }),
      makeLiveLayer(redisClient),
    );

    expect(entries).toHaveLength(matrixDestinations.length);
    expect(entries[0]?.destinationIndex).toBe(0);
    expect(entries[1]?.destinationIndex).toBe(1);
    expect(entries[2]?.destinationIndex).toBe(2);
    expect(entries.every(entry => entry.distanceMeters === null || entry.distanceMeters > 0)).toBe(true);
    expect(entries.every(entry => entry.durationSeconds === null || entry.durationSeconds > 0)).toBe(true);
    expect(redisClient.store.size).toBe(1);

    const cachedPayload = JSON.parse([...redisClient.store.values()][0] ?? "null") as {
      entries?: Array<{ destinationIndex?: number }>;
    } | null;

    expect(cachedPayload?.entries?.map(entry => entry.destinationIndex)).toEqual([0, 1, 2]);
  });
});

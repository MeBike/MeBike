import { describe, expect, it } from "vitest";

import {
  buildMatrixCacheKey,
  buildRouteCacheKey,
  cacheTtlSecondsForProfile,
  normalizeCoordinateForCache,
} from "../routing.helpers";

describe("mapbox routing cache helpers", () => {
  it("normalizes coordinates into stable cache tokens", () => {
    expect(normalizeCoordinateForCache({
      latitude: 10.7769123,
      longitude: 106.7009876,
    })).toBe("10.77691,106.70099");
  });

  it("builds a stable route cache key", () => {
    const key = buildRouteCacheKey({
      origin: { latitude: 10.7769123, longitude: 106.7009876 },
      destination: { latitude: 10.7626123, longitude: 106.6602876 },
      profile: "cycling",
      geometryFormat: "polyline6",
    });

    expect(key).toBe(
      "mapbox:routing:v1:route:cycling:10.77691,106.70099:10.76261,106.66029:polyline6",
    );
  });

  it("builds a stable matrix cache key with ordered destinations", () => {
    const key = buildMatrixCacheKey({
      origin: { latitude: 10.7769123, longitude: 106.7009876 },
      destinations: [
        { latitude: 10.7626123, longitude: 106.6602876 },
        { latitude: 10.7801123, longitude: 106.6904876 },
      ],
      profile: "driving",
    });

    expect(key).toBe(
      "mapbox:routing:v1:matrix:driving:10.77691,106.70099:10.76261,106.66029|10.78011,106.69049",
    );
  });

  it("uses long TTLs for non-traffic profiles and short TTL for traffic", () => {
    expect(cacheTtlSecondsForProfile("walking")).toBe(60 * 60 * 24 * 90);
    expect(cacheTtlSecondsForProfile("cycling")).toBe(60 * 60 * 24 * 90);
    expect(cacheTtlSecondsForProfile("driving")).toBe(60 * 60 * 24 * 30);
    expect(cacheTtlSecondsForProfile("driving-traffic")).toBe(60 * 10);
  });
});

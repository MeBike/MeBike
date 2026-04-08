import type { MapboxCoordinate, MapboxMatrixRequest, MapboxRouteGeometryFormat, MapboxRoutingProfile } from "./types";

const MAPBOX_ROUTING_CACHE_VERSION = "v1";
const MAPBOX_ROUTING_CACHE_PREFIX = `mapbox:routing:${MAPBOX_ROUTING_CACHE_VERSION}`;
const MAPBOX_COORDINATE_PRECISION = 5;

const ROUTING_CACHE_TTL_SECONDS: Record<MapboxRoutingProfile, number> = {
  "walking": 60 * 60 * 24 * 90,
  "cycling": 60 * 60 * 24 * 90,
  "driving": 60 * 60 * 24 * 30,
  "driving-traffic": 60 * 10,
};

export function toSdkCoordinate(coordinate: MapboxCoordinate): [number, number] {
  return [coordinate.longitude, coordinate.latitude];
}

export function hasValidCoordinates(coordinate: MapboxCoordinate) {
  return Number.isFinite(coordinate.latitude) && Number.isFinite(coordinate.longitude);
}

export function normalizeCoordinateForCache(coordinate: MapboxCoordinate): string {
  return `${coordinate.latitude.toFixed(MAPBOX_COORDINATE_PRECISION)},${coordinate.longitude.toFixed(MAPBOX_COORDINATE_PRECISION)}`;
}

export function cacheTtlSecondsForProfile(profile: MapboxRoutingProfile): number {
  return ROUTING_CACHE_TTL_SECONDS[profile];
}

export function buildRouteCacheKey(args: {
  readonly origin: MapboxCoordinate;
  readonly destination: MapboxCoordinate;
  readonly profile: MapboxRoutingProfile;
  readonly geometryFormat: MapboxRouteGeometryFormat;
}) {
  return [
    MAPBOX_ROUTING_CACHE_PREFIX,
    "route",
    args.profile,
    normalizeCoordinateForCache(args.origin),
    normalizeCoordinateForCache(args.destination),
    args.geometryFormat,
  ].join(":");
}

export function buildMatrixCacheKey(args: MapboxMatrixRequest) {
  return [
    MAPBOX_ROUTING_CACHE_PREFIX,
    "matrix",
    args.profile,
    normalizeCoordinateForCache(args.origin),
    args.destinations.map(normalizeCoordinateForCache).join("|"),
  ].join(":");
}

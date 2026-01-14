import { log } from "@lib/log";

type Coordinates = {
  latitude: number;
  longitude: number;
};

export type MapboxRouteLine = {
  type: "Feature";
  properties: {
    distanceMeters: number;
    durationSeconds: number;
  };
  geometry: {
    type: "LineString";
    coordinates: Array<[number, number]>;
  };
};

type DirectionsResponse = {
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: Array<[number, number]>;
      type: "LineString";
    };
  }>;
};

export async function getRouteLine(
  origin: Coordinates,
  destination: Coordinates,
): Promise<MapboxRouteLine | null> {
  const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (!token) {
    log.warn("Mapbox access token missing for directions", {
      env: "EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN",
    });
    return null;
  }

  const originPart = `${origin.longitude},${origin.latitude}`;
  const destinationPart = `${destination.longitude},${destination.latitude}`;

  const url = new URL(
    `https://api.mapbox.com/directions/v5/mapbox/walking/${originPart};${destinationPart}`,
  );
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("overview", "full");
  url.searchParams.set("steps", "false");
  url.searchParams.set("access_token", token);

  const response = await fetch(url.toString());
  if (!response.ok) {
    log.warn("Mapbox directions request failed", {
      status: response.status,
    });
    return null;
  }

  const json = await response.json() as DirectionsResponse;
  const firstRoute = json.routes?.[0];
  if (!firstRoute) {
    return null;
  }

  return {
    type: "Feature",
    properties: {
      distanceMeters: firstRoute.distance,
      durationSeconds: firstRoute.duration,
    },
    geometry: {
      type: "LineString",
      coordinates: firstRoute.geometry.coordinates,
    },
  };
}

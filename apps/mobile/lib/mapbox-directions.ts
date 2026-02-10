import { log } from "@lib/log";
import ky from "ky";

type Coordinates = {
  latitude: number;
  longitude: number;
};

export type MapboxDirectionsProfile = "walking" | "cycling" | "driving";

export type MapboxRouteLine = {
  type: "Feature";
  properties: {
    distanceMeters: number;
    durationSeconds: number;
    profile: MapboxDirectionsProfile;
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

const mapboxKy = ky.create({
  retry: { limit: 0 },
  timeout: 15000,
});

export async function getRouteLine(
  origin: Coordinates,
  destination: Coordinates,
  profile: MapboxDirectionsProfile = "walking",
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
    `https://api.mapbox.com/directions/v5/mapbox/${profile}/${originPart};${destinationPart}`,
  );
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("overview", "full");
  url.searchParams.set("steps", "false");
  url.searchParams.set("access_token", token);

  let json: DirectionsResponse;
  try {
    json = await mapboxKy.get(url.toString()).json<DirectionsResponse>();
  }
  catch (error) {
    log.warn("Mapbox directions request failed", {
      error: String(error),
    });
    return null;
  }

  const firstRoute = json.routes?.[0];
  if (!firstRoute) {
    return null;
  }

  return {
    type: "Feature",
    properties: {
      distanceMeters: firstRoute.distance,
      durationSeconds: firstRoute.duration,
      profile,
    },
    geometry: {
      type: "LineString",
      coordinates: firstRoute.geometry.coordinates,
    },
  };
}

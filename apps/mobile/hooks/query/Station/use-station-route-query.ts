import type { MapboxDirectionsProfile, MapboxRouteLine } from "@lib/mapbox-directions";

import { getRouteLine } from "@lib/mapbox-directions";
import { useQuery } from "@tanstack/react-query";

type Coordinates = {
  latitude: number;
  longitude: number;
};

function roundCoordinate(value: number): number {
  return Number.parseFloat(value.toFixed(5));
}

type UseStationRouteQueryArgs = {
  origin: Coordinates | null;
  destination: Coordinates | null;
  profile: MapboxDirectionsProfile;
  enabled: boolean;
};

export function useStationRouteQuery({
  origin,
  destination,
  profile,
  enabled,
}: UseStationRouteQueryArgs) {
  return useQuery({
    queryKey: [
      "mapbox-directions",
      profile,
      origin ? roundCoordinate(origin.latitude) : null,
      origin ? roundCoordinate(origin.longitude) : null,
      destination ? roundCoordinate(destination.latitude) : null,
      destination ? roundCoordinate(destination.longitude) : null,
    ],
    queryFn: async (): Promise<MapboxRouteLine | null> => {
      if (!origin || !destination) {
        return null;
      }

      return getRouteLine(origin, destination, profile);
    },
    enabled: enabled && Boolean(origin) && Boolean(destination),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

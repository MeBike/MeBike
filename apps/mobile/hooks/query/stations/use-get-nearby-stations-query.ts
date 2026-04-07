import type { StationError } from "@services/station-error";

import { stationService } from "@services/station.service";
import { useQuery } from "@tanstack/react-query";

async function fetchNearbyStations(latitude: number, longitude: number) {
  const result = await stationService.getNearMe(latitude, longitude);
  if (!result.ok) {
    throw result.error;
  }

  return result.value;
}

export function useGetNearbyStationsQuery(latitude: number, longitude: number, enabled: boolean = true) {
  return useQuery<Awaited<ReturnType<typeof fetchNearbyStations>>, StationError>({
    enabled: enabled && latitude !== 0 && longitude !== 0,
    queryFn: () => fetchNearbyStations(latitude, longitude),
    queryKey: ["stations", "nearby", latitude, longitude],
  });
}

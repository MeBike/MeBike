import type { StationError } from "@services/station-error";

import { stationService } from "@services/station.service";
import { useQuery } from "@tanstack/react-query";

export function useGetNearMeStations(latitude: number, longitude: number, enabled: boolean = true) {
  return useQuery<Awaited<ReturnType<typeof fetchNearMeStations>>, StationError>({
    queryKey: ["near-me-stations", latitude, longitude, enabled],
    queryFn: () => fetchNearMeStations(latitude, longitude),
    enabled: enabled && latitude !== 0 && longitude !== 0,
  });
}

async function fetchNearMeStations(latitude: number, longitude: number) {
  const result = await stationService.getNearMe(latitude, longitude);
  if (!result.ok) {
    throw result.error;
  }

  return result.value;
}

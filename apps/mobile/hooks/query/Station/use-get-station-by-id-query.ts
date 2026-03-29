import type { StationError } from "@services/station-error";

import { stationService } from "@services/station.service";
import { useQuery } from "@tanstack/react-query";

export function useGetStationById(stationId: string) {
  return useQuery<Awaited<ReturnType<typeof fetchStationById>>, StationError>({
    queryKey: ["station", stationId],
    queryFn: () => fetchStationById(stationId),
    enabled: !!stationId,
  });
}

async function fetchStationById(stationId: string) {
  const result = await stationService.getStationById(stationId);
  if (!result.ok) {
    throw result.error;
  }

  return result.value;
}

import type { StationError } from "@services/station-error";

import { stationService } from "@services/station.service";
import { useQuery } from "@tanstack/react-query";

export function useGetStationLookupQuery(
  stationId: string | undefined,
  enabled: boolean = true,
) {
  return useQuery<Awaited<ReturnType<typeof fetchStationLookup>>, StationError>({
    queryKey: ["reservations", "station-lookup", stationId ?? null],
    enabled: enabled && Boolean(stationId),
    queryFn: async () => fetchStationLookup(stationId!),
  });
}

async function fetchStationLookup(stationId: string) {
  const result = await stationService.getStationById(stationId);
  if (!result.ok) {
    throw result.error;
  }

  return result.value;
}

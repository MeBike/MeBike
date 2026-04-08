import type { StationError } from "@services/station-error";

import { stationService } from "@services/station.service";
import { useQuery } from "@tanstack/react-query";

async function fetchStationDetail(stationId: string) {
  const result = await stationService.getStationById(stationId);
  if (!result.ok) {
    throw result.error;
  }

  return result.value;
}

export function useGetStationDetailQuery(stationId: string) {
  return useQuery<Awaited<ReturnType<typeof fetchStationDetail>>, StationError>({
    enabled: Boolean(stationId),
    queryFn: () => fetchStationDetail(stationId),
    queryKey: ["stations", "detail", stationId],
  });
}

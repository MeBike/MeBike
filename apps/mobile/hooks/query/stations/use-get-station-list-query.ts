import type { StationError } from "@services/station-error";

import { stationService } from "@services/station.service";
import { useQuery } from "@tanstack/react-query";

async function fetchStationList() {
  const result = await stationService.getAllStations();
  if (!result.ok) {
    throw result.error;
  }

  return result.value;
}

export function useGetStationListQuery(enabled: boolean = true) {
  return useQuery<Awaited<ReturnType<typeof fetchStationList>>, StationError>({
    enabled,
    queryFn: fetchStationList,
    queryKey: ["stations", "list"],
  });
}

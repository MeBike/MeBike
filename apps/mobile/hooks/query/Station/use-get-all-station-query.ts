import type { StationError } from "@services/station-error";

import { stationService } from "@services/station.service";
import { useQuery } from "@tanstack/react-query";

export function useGetAllStation() {
  return useQuery<Awaited<ReturnType<typeof fetchAllStations>>, StationError>({
    queryKey: ["stations", "list"],
    queryFn: fetchAllStations,
  });
}

async function fetchAllStations() {
  const result = await stationService.getAllStations();
  if (!result.ok) {
    throw result.error;
  }

  return result.value;
}

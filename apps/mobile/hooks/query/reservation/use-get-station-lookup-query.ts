import { stationService } from "@services/station.service";
import { useQuery } from "@tanstack/react-query";

export function useGetStationLookupQuery(
  stationId: string | undefined,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ["reservations", "station-lookup", stationId ?? null],
    enabled: enabled && Boolean(stationId),
    queryFn: async () => stationService.getStationById(stationId!),
  });
}

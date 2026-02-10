import { stationService } from "@services/station.service";
import { useQuery } from "@tanstack/react-query";

export function useGetStationById(stationId: string) {
  return useQuery({
    queryKey: ["station", stationId],
    queryFn: () => stationService.getStationById(stationId),
    enabled: !!stationId,
  });
}

import { stationService } from "@services/station.service";
import { useQuery } from "@tanstack/react-query";

export function useGetStationLookupQuery(stationId?: string, enabled = false) {
  return useQuery({
    queryKey: ["stations", stationId],
    enabled: enabled && Boolean(stationId),
    queryFn: async () => {
      return stationService.getStationById(stationId || "");
    },
  });
}

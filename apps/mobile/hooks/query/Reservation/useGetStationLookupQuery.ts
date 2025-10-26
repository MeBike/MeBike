import { useQuery } from "@tanstack/react-query";
import { stationService } from "@services/stationService";

export const useGetStationLookupQuery = (stationId?: string, enabled = false) => {
  return useQuery({
    queryKey: ["stations", stationId],
    enabled: enabled && Boolean(stationId),
    queryFn: async () => {
      const response = await stationService.getStationById(stationId || "");
      return response.data.result;
    },
  });
};

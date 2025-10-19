import { useQuery } from "@tanstack/react-query";
import { stationService } from "@services/stationService";
export const useGetStationById = (stationId: string) => {
    return useQuery({
        queryKey: ["station", stationId],
        queryFn: async () => {
            return stationService.getStationById(stationId);
        },
        enabled: !!stationId,
    });
}
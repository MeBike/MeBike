import { useQuery } from "@tanstack/react-query";
import { stationService } from "@services/stationService";

export const useGetAllStation = () => {
    return useQuery({
      queryKey: ["all-stations"],
      queryFn: stationService.getAllStations,
    });
}
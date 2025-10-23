import { useQuery } from "@tanstack/react-query";
import { stationService } from "@/services/station.service";

export const useGetAllStation = () => {
    return useQuery({
        queryKey: ["all-stations"],
        queryFn: async () => {
            return stationService.getAllStations();
        }
    });
}
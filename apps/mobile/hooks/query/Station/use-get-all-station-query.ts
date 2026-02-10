import { stationService } from "@services/station.service";
import { useQuery } from "@tanstack/react-query";

export function useGetAllStation() {
  return useQuery({
    queryKey: ["stations", "list"],
    queryFn: () => stationService.getAllStations(),
  });
}

import { stationService } from "@services/station.service";
import { useQuery } from "@tanstack/react-query";

export function useGetNearMeStations(latitude: number, longitude: number, enabled: boolean = true) {
  return useQuery({
    queryKey: ["near-me-stations", latitude, longitude, enabled],
    queryFn: () => stationService.getNearMe(latitude, longitude),
    enabled: enabled && latitude !== 0 && longitude !== 0,
  });
}

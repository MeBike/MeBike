import { useQuery } from "@tanstack/react-query";
import { stationService } from "@/services/station.service";

interface UseGetNearestAvailableBikeProps {
  latitude: number;
  longitude: number;
}
export const useGetNearestAvailableBike = ({
  latitude,
  longitude,
}: UseGetNearestAvailableBikeProps) => {
  return useQuery({
    queryKey: ["station", "nearest-available-bike", latitude, longitude],
    queryFn: () =>
      stationService.getStationNearestAvailableBike({ latitude, longitude }),
    enabled: !!latitude && !!longitude,
  });
};
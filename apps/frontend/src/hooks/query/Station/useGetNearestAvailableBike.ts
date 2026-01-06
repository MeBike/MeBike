import { useSuspenseQuery } from "@tanstack/react-query";
import { stationService } from "@/services/station.service";
import { QUERY_KEYS } from "@/constants/queryKey";

interface UseGetNearestAvailableBikeProps {
  latitude: number;
  longitude: number;
}
export const useGetNearestAvailableBike = ({
  latitude,
  longitude,
}: UseGetNearestAvailableBikeProps) => {
  return useSuspenseQuery({
    queryKey: QUERY_KEYS.STATION.NEAREST_AVAILABLE_BIKE(latitude, longitude),
    queryFn: () =>
      stationService.getStationNearestAvailableBike({ latitude, longitude }),
  });
};
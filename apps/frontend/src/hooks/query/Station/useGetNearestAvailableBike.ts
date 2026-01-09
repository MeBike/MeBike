import { useSuspenseQuery } from "@tanstack/react-query";
import { stationService } from "@/services/station.service";
import { QUERY_KEYS } from "@/constants/queryKey";
import { HTTP_STATUS } from "@/constants";
interface UseGetNearestAvailableBikeProps {
  latitude: number;
  longitude: number;
}
const getNearestAvailableBike = async ({ latitude, longitude }: UseGetNearestAvailableBikeProps) => {
    try {
        const response = await stationService.getStationNearestAvailableBike({ latitude, longitude });
        if (response.status === HTTP_STATUS.OK) {
            return response.data;
        }
    } catch (error) {
        console.log(error);
        throw new Error("Failed to fetch nearest available bike");
    }
}
export const useGetNearestAvailableBike = ({
  latitude,
  longitude,
}: UseGetNearestAvailableBikeProps) => {
  return useSuspenseQuery({
    queryKey: QUERY_KEYS.STATION.NEAREST_AVAILABLE_BIKE(latitude, longitude),
    queryFn: () =>
      getNearestAvailableBike({ latitude, longitude }),
  });
};
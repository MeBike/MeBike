import { useSuspenseQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";
import { QUERY_KEYS } from "@/constants/queryKey";
import { HTTP_STATUS } from "@/constants";
const getBikeActivityStats = async (bikeId: string) => {
  try {
    const response = await bikeService.getBikeActivityStats(bikeId);
    if (response.status === HTTP_STATUS.OK) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch bike activity stats");
  }
};
export const useGetBikeActivityStatsQuery = (bikeId: string) => {
  return useSuspenseQuery({
    queryKey: QUERY_KEYS.BIKE.BIKE_ACTIVITY_STATS(bikeId),  
    queryFn: () => getBikeActivityStats(bikeId), 
  });
}
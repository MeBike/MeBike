import { useSuspenseQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";
import { QUERY_KEYS } from "@/constants/queryKey";
import { HTTP_STATUS } from "@/constants";
const getBikeStats = async (bikeId: string) => {
  try {
    const response = await bikeService.getStatisticsBike(bikeId);
    if (response.status === HTTP_STATUS.OK) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch bikeuseGetBikeStatsQuery stats");
  }
};
export const useGetBikeStatsQuery = (bikeId: string) => {
  return useSuspenseQuery({
    queryKey: QUERY_KEYS.BIKE.BIKE_STATS(bikeId),
    queryFn: () => getBikeStats(bikeId),
  });
};

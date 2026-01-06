import { useSuspenseQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";
import { QUERY_KEYS } from "@/constants/queryKey";
const fetchBikeStats = async (bikeId: string) => {
  try {
    const response = await bikeService.getStatisticsBike(bikeId);
    if (response.status === 200) {
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
    queryFn: () => fetchBikeStats(bikeId),
  });
};

import { useQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";
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
  return useQuery({
    queryKey: ["bike-stats", bikeId],
    queryFn: () => fetchBikeStats(bikeId),
    enabled: !!bikeId,
  });
};

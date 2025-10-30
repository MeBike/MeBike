import { useQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";
const fetchBikeActivityStats = async (bikeId: string) => {
  try {
    const response = await bikeService.getBikeActivityStats(bikeId);
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch bike activity stats");
  }
};
export const useGetBikeActivityStatsQuery = (bikeId: string) => {
  return useQuery({
    queryKey: ["bike-activity-stats", bikeId],  
    queryFn: () => fetchBikeActivityStats(bikeId),
    enabled: !!bikeId, 
  });
}
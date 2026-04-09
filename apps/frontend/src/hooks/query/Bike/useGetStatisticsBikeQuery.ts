import { useQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";
import { QUERY_KEYS } from "@/constants/queryKey";
const fetchStatisticsBike = async (bikeId: string) => {
  try {
    const response = await bikeService.getStatisticsBike(bikeId);
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch bike activity stats");
  }
};
export const useGetStatisticsBikeQuery = (bikeId: string) => {
  return useQuery({
    queryKey: ["statistics","bikes"],
    queryFn: () => fetchStatisticsBike(bikeId),
    enabled: !!bikeId,
  });
};

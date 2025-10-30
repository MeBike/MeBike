import { useQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";
const fetchBikeRentalHistory = async (bikeId: string) => {
  try {
    const response = await bikeService.getRentalHistoryBike(bikeId);
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch bike activity stats");
  }
};
export const useGetRentalBikeQuery = (bikeId: string) => {
  return useQuery({
    queryKey: ["bike-rentals-history", bikeId],
    queryFn: () => fetchBikeRentalHistory(bikeId),
    enabled: !!bikeId,
  });
};

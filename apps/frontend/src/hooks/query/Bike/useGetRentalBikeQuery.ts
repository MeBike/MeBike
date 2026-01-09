import { useSuspenseQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";
import { QUERY_KEYS } from "@/constants/queryKey";
const getBikeRentalHistory = async (bikeId: string) => {
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
  return useSuspenseQuery({
    queryKey: QUERY_KEYS.BIKE.RENTAL_BIKE(bikeId),
    queryFn: () => getBikeRentalHistory(bikeId),
  });
};

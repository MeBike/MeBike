import { useQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";
import type { BikeStatus } from "@/types";
import { QUERY_KEYS } from "@/constants/queryKey";
const getAllBikes = async (
  page?: number,
  limit?: number,
) => {
  try {
    const response = await bikeService.getAllBikes({
      page: page,
      limit: limit,
    });
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch bikes");
  }
};
export const useGetAllBikeQuery = ({
  page,
  limit,
}: {
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: QUERY_KEYS.BIKE.ALL(page, limit),
    queryFn: () => getAllBikes(page, limit),
  });
};

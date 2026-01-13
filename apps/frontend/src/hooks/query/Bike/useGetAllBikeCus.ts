import { useSuspenseQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";
import { QUERY_KEYS } from "@/constants/queryKey";
import { HTTP_STATUS } from "@/constants";
const getAllBikes = async (
  page?: number,
  limit?: number,
  search?: string,
) => {
  try {
    const response = await bikeService.getAllBikes({
      page: page,
      limit: limit,
      search : search,
    });
    if (response.status === HTTP_STATUS.OK) {
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
  search,
}: {
  page?: number;
  limit?: number;
  search?: string,
}) => {
  return useSuspenseQuery({
    queryKey: QUERY_KEYS.BIKE.ALL(page,limit,search),
    queryFn: () => getAllBikes(page,limit,search),
  });
};

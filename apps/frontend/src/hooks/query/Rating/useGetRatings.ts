import { useQuery } from "@tanstack/react-query";
import { ratingService } from "@/services/rating.service";
import { HTTP_STATUS } from "@/constants";
const getRatings = async ({
  page,
  pageSize,
}: {
  page?: number;
  pageSize?: number;
}) => {
  try {
    const query: Record<string, number | string> = {
      page: page ?? 1,
      pageSize: pageSize ?? 7,
    };
    const response = await ratingService.getAllRatings(query);
    if (response.status === HTTP_STATUS.OK) {
      return response.data;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch ratings");
  }
};
export const useGetRatingQuery =  ({
  page,
  pageSize,
}: {
  page?: number;
  pageSize?: number;
}) => {
  return useQuery({
    queryKey: ["ratings"],
    queryFn: () => getRatings({ page: page, pageSize: pageSize }),
  });
};

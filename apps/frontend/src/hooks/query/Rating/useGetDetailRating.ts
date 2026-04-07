import { useQuery } from "@tanstack/react-query";
import { ratingService } from "@/services/rating.service";
import { HTTP_STATUS } from "@/constants";
const getDetailRating = async ({ id }: { id: string }) => {
  try {
    const response = await ratingService.getRatingDetail(id);
    if (response.status === HTTP_STATUS.OK) {
      return response.data;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch detail rating");
  }
};
export const useGetDetailRatingQuery = ({id} : {id : string}) => {
    return useQuery({
        queryKey : ["rating","detail",id],
        queryFn : () => getDetailRating({id}),
        enabled : !!id,
    })
}
import { ratingService } from "@services/rating.service";
import { useQuery } from "@tanstack/react-query";

export function useGetRatingQuery(rentalId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["rating", "detail", rentalId],
    enabled: enabled && !!rentalId,
    queryFn: async () => {
      const response = await ratingService.getRating(rentalId);
      return response.data.result;
    },
  });
}

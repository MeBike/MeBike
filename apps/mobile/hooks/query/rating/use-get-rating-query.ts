import type { RatingDetail, RatingError } from "@services/ratings";

import { ratingService } from "@services/ratings";
import { useQuery } from "@tanstack/react-query";

export function useGetRatingQuery(rentalId: string, enabled: boolean = true) {
  return useQuery<RatingDetail | null, RatingError>({
    queryKey: ["rating", "detail", rentalId],
    enabled: enabled && Boolean(rentalId),
    queryFn: async () => {
      const result = await ratingService.getRating(rentalId);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}

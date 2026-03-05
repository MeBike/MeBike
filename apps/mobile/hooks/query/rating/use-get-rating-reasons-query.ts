import type { RatingError, RatingReason, RatingReasonFilters } from "@services/ratings";

import { ratingService } from "@services/ratings";
import { useQuery } from "@tanstack/react-query";

export function useGetRatingReasonsQuery(enabled = true, params?: RatingReasonFilters) {
  return useQuery<RatingReason[], RatingError>({
    queryKey: ["rating", "reasons", params],
    enabled,
    queryFn: async () => {
      const result = await ratingService.getRatingReasons(params);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}

import type { RatingError, RatingReason, RatingReasonFilters } from "@services/ratings";

import { ratingService } from "@services/ratings";
import { useQuery } from "@tanstack/react-query";

export function useGetRatingReasonsQuery(
  enabled: boolean = true,
  filters?: RatingReasonFilters,
) {
  return useQuery<RatingReason[], RatingError>({
    queryKey: ["rating", "reasons", filters?.type ?? null, filters?.appliesTo ?? null],
    enabled,
    queryFn: async () => {
      const result = await ratingService.getRatingReasons(filters);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}

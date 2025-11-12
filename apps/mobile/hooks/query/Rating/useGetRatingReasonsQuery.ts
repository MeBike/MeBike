import { ratingService } from "@services/rating.service";
import { useQuery } from "@tanstack/react-query";

export function useGetRatingReasonsQuery(enabled: boolean = true, params?: Partial<{ type: string; applies_to: string }>) {
  return useQuery({
    queryKey: ["rating", "reasons", params],
    enabled,
    queryFn: async () => {
      const response = await ratingService.getRatingReasons(params);
      return response.data.result;
    },
  });
}

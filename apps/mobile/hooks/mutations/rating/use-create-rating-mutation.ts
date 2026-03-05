import type { CreateRatingPayload, RatingDetail, RatingError } from "@services/ratings";

import { ratingService } from "@services/ratings";
import { useMutation } from "@tanstack/react-query";

type CreateRatingVariables = {
  rentalId: string;
  payload: CreateRatingPayload;
};

export function useCreateRatingMutation() {
  return useMutation<RatingDetail, RatingError, CreateRatingVariables>({
    mutationFn: async ({ rentalId, payload }) => {
      const result = await ratingService.createRating(rentalId, payload);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}

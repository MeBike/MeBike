import { useMutation } from "@tanstack/react-query";

import { ratingService } from "@services/rating.service";

import type { CreateRatingPayload } from "../../../types/RatingTypes";

type CreateRatingVariables = {
  rentalId: string;
  payload: CreateRatingPayload;
};

export function useCreateRatingMutation() {
  return useMutation({
    mutationFn: ({ rentalId, payload }: CreateRatingVariables) =>
      ratingService.createRating(rentalId, payload),
  });
}

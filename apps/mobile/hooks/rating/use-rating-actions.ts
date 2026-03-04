import type { CreateRatingPayload, RatingReason, RatingReasonFilters } from "@services/ratings";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { Alert } from "react-native";

import { useCreateRatingMutation } from "../mutations/rating/use-create-rating-mutation";
import { useGetRatingReasonsQuery } from "../query/rating/use-get-rating-reasons-query";
import { getRatingErrorCode, getRatingErrorMessage } from "./use-rating-errors";

type MutationCallbacks = {
  onSuccess?: () => void;
  onAlreadyRated?: () => void;
  onError?: (message: string) => void;
};

export function useRatingActions({
  enabled,
  reasonFilters,
}: {
  enabled: boolean;
  reasonFilters?: RatingReasonFilters;
}) {
  const queryClient = useQueryClient();
  const ratingReasonsQuery = useGetRatingReasonsQuery(enabled, reasonFilters);
  const createRatingMutation = useCreateRatingMutation();

  const submitRating = useCallback(
    (rentalId: string, payload: CreateRatingPayload, callbacks?: MutationCallbacks) => {
      createRatingMutation.mutate(
        { rentalId, payload },
        {
          onSuccess: () => {
            Alert.alert("Cảm ơn bạn!", "Đánh giá của bạn đã được ghi nhận.");
            queryClient.invalidateQueries({ queryKey: ["rating", "detail", rentalId] });
            queryClient.invalidateQueries({ queryKey: ["rating", "reasons"] });
            callbacks?.onSuccess?.();
          },
          onError: (error) => {
            const code = getRatingErrorCode(error);

            if (code === "RATING_ALREADY_EXISTS") {
              callbacks?.onAlreadyRated?.();
              Alert.alert("Thông báo", "Bạn đã đánh giá phiên thuê này trước đó.");
              return;
            }

            const message = getRatingErrorMessage(
              error,
              "Không thể gửi đánh giá. Vui lòng thử lại.",
            );

            callbacks?.onError?.(message);
            Alert.alert("Không thể gửi đánh giá", message);
          },
        },
      );
    },
    [createRatingMutation, queryClient],
  );

  return {
    ratingReasons: (ratingReasonsQuery.data ?? []) as RatingReason[],
    isRatingReasonsLoading: ratingReasonsQuery.isLoading,
    isRatingReasonsError: ratingReasonsQuery.isError,
    refetchRatingReasons: ratingReasonsQuery.refetch,
    submitRating,
    isSubmittingRating: createRatingMutation.isPending,
  };
}

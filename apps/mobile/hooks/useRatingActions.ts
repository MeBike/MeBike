import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { Alert } from "react-native";

import type { CreateRatingPayload, RatingReason } from "../types/RatingTypes";

import { useCreateRatingMutation } from "./mutations/Rating/useCreateRatingMutation";
import { useGetRatingReasonsQuery } from "./query/Rating/useGetRatingReasonsQuery";

type MutationCallbacks = {
  onSuccess?: () => void;
  onAlreadyRated?: () => void;
  onError?: (message: string) => void;
};

function extractErrorMessage(error: unknown): string {
  if (
    typeof error === "object"
    && error !== null
    && "response" in error
    && typeof (error as any).response?.data?.message === "string"
  ) {
    return (error as any).response.data.message;
  }
  return "Không thể gửi đánh giá. Vui lòng thử lại.";
}

export function useRatingActions({
  enabled,
  reasonFilters,
}: {
  enabled: boolean;
  reasonFilters?: Partial<{ type: string; applies_to: string }>;
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
            queryClient.invalidateQueries({ queryKey: ["rating", "reasons"] });
            queryClient.invalidateQueries({ queryKey: ["rating", "detail", rentalId] });
            callbacks?.onSuccess?.();
          },
          onError: (error) => {
            const message = extractErrorMessage(error);
            if (message.includes("đã tồn tại")) {
              callbacks?.onAlreadyRated?.();
              Alert.alert("Thông báo", "Bạn đã đánh giá phiên thuê này trước đó.");
              return;
            }
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

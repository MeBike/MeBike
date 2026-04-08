import type { RentalError } from "@services/rentals";

import {
  invalidateMyRentalQueries,
  invalidateStaffBikeSwapQueries,
  invalidateStaffRentalQueries,
} from "@hooks/rentals/rental-cache";
import { rentalServiceV1 } from "@services/rentals";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type {
  BikeSwapRequestDetail,
  RejectBikeSwapRequestPayload,
} from "@/types/rental-types";

export type RejectBikeSwapRequestVariables = {
  bikeSwapRequestId: string;
  payload: RejectBikeSwapRequestPayload;
};

export function useRejectBikeSwapRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation<BikeSwapRequestDetail, RentalError, RejectBikeSwapRequestVariables>({
    mutationFn: async ({ bikeSwapRequestId, payload }) => {
      const result = await rentalServiceV1.rejectBikeSwapRequest(
        bikeSwapRequestId,
        payload,
      );
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
    onSuccess: async () => {
      await Promise.all([
        invalidateStaffBikeSwapQueries(queryClient),
        invalidateStaffRentalQueries(queryClient),
        invalidateMyRentalQueries(queryClient),
      ]);
    },
  });
}

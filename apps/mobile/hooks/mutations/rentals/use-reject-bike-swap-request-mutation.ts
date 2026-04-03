import type { RentalError } from "@services/rentals";

import { rentalServiceV1 } from "@services/rentals";
import { useMutation } from "@tanstack/react-query";

import type {
  BikeSwapRequestDetail,
  RejectBikeSwapRequestPayload,
} from "@/types/rental-types";

export type RejectBikeSwapRequestVariables = {
  bikeSwapRequestId: string;
  payload: RejectBikeSwapRequestPayload;
};

export function useRejectBikeSwapRequestMutation() {
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
  });
}

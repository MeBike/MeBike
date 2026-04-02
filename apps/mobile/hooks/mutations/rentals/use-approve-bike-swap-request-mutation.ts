import type { RentalError } from "@services/rentals";

import { rentalServiceV1 } from "@services/rentals";
import { useMutation } from "@tanstack/react-query";

import type { BikeSwapRequestDetail } from "@/types/rental-types";

export type ApproveBikeSwapRequestVariables = {
  bikeSwapRequestId: string;
};

export function useApproveBikeSwapRequestMutation() {
  return useMutation<BikeSwapRequestDetail, RentalError, ApproveBikeSwapRequestVariables>({
    mutationFn: async ({ bikeSwapRequestId }) => {
      const result = await rentalServiceV1.approveBikeSwapRequest(bikeSwapRequestId);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}

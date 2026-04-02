import type { RentalError } from "@services/rentals";

import { rentalServiceV1 } from "@services/rentals";
import { useMutation } from "@tanstack/react-query";

import type { BikeSwapRequest, RequestBikeSwapPayload } from "@/types/rental-types";

export type RequestBikeSwapVariables = {
  rentalId: string;
  payload: RequestBikeSwapPayload;
};

export function useRequestBikeSwapMutation() {
  return useMutation<BikeSwapRequest, RentalError, RequestBikeSwapVariables>({
    mutationFn: async ({ rentalId, payload }) => {
      const result = await rentalServiceV1.requestBikeSwap(rentalId, payload);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}

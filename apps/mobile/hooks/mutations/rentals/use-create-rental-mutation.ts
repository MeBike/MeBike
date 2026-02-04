import type { RentalError } from "@services/rentals";

import { rentalServiceV1 } from "@services/rentals";
import { useMutation } from "@tanstack/react-query";

import type { CreateRentalPayload, RentalWithPrice } from "@/types/rental-types";

export function useCreateRentalMutation() {
  return useMutation<RentalWithPrice, RentalError, CreateRentalPayload>({
    mutationFn: (payload) => rentalServiceV1.createRental(payload).then((result) => {
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    }),
  });
}

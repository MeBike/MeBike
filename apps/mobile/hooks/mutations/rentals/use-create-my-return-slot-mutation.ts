import type { RentalError } from "@services/rentals";

import { rentalServiceV1 } from "@services/rentals";
import { useMutation } from "@tanstack/react-query";

import type { ReturnSlotReservation } from "@/types/rental-types";

type CreateMyReturnSlotVariables = {
  rentalId: string;
  stationId: string;
};

export function useCreateMyReturnSlotMutation() {
  return useMutation<ReturnSlotReservation, RentalError, CreateMyReturnSlotVariables>({
    mutationFn: async ({ rentalId, stationId }) => {
      const result = await rentalServiceV1.createMyReturnSlot(rentalId, { stationId });
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}

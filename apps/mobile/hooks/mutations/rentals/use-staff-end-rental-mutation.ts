import type { RentalError } from "@services/rentals";

import { rentalServiceV1 } from "@services/rentals";
import { useMutation } from "@tanstack/react-query";

import type { RentalWithPricing } from "@/types/rental-types";

export type StaffEndRentalVariables = {
  rentalId: string;
  endStation: string;
  reason: string;
  endTime?: string;
};

export function useStaffEndRentalMutation() {
  return useMutation<RentalWithPricing, RentalError, StaffEndRentalVariables>({
    mutationFn: (payload) => rentalServiceV1.endRentalByAdmin(payload).then((result) => {
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    }),
  });
}

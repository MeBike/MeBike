import type { RentalError } from "@services/rentals";

import { invalidateStaffRentalQueries } from "@hooks/rentals/rental-cache";
import { rentalServiceV1 } from "@services/rentals";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { RentalWithPricing } from "@/types/rental-types";

export type StaffEndRentalVariables = {
  rentalId: string;
  stationId: string;
  reason: string;
  confirmedAt?: string;
  confirmationMethod?: "MANUAL" | "QR_CODE";
};

export function useStaffEndRentalMutation() {
  const queryClient = useQueryClient();

  return useMutation<RentalWithPricing, RentalError, StaffEndRentalVariables>({
    mutationFn: payload => rentalServiceV1.endRentalByAdmin(payload).then((result) => {
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    }),
    onSuccess: async () => {
      await invalidateStaffRentalQueries(queryClient);
    },
  });
}

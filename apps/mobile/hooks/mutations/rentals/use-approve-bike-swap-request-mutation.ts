import type { RentalError } from "@services/rentals";

import {
  invalidateMyRentalQueries,
  invalidateStaffBikeSwapQueries,
  invalidateStaffRentalQueries,
} from "@hooks/rentals/rental-cache";
import { rentalServiceV1 } from "@services/rentals";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { BikeSwapRequestDetail } from "@/types/rental-types";

export type ApproveBikeSwapRequestVariables = {
  bikeSwapRequestId: string;
};

export function useApproveBikeSwapRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation<BikeSwapRequestDetail, RentalError, ApproveBikeSwapRequestVariables>({
    mutationFn: async ({ bikeSwapRequestId }) => {
      const result = await rentalServiceV1.approveBikeSwapRequest(bikeSwapRequestId);
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

import type { RentalError } from "@services/rentals";

import { rentalKeys } from "@hooks/query/rentals/rental-query-keys";
import { rentalServiceV1 } from "@services/rentals";
import { useQuery } from "@tanstack/react-query";

import type { BikeSwapRequestDetail } from "@/types/rental-types";

export function useStaffBikeSwapRequestQuery(
  bikeSwapRequestId: string,
  enabled: boolean = true,
) {
  return useQuery<BikeSwapRequestDetail, RentalError>({
    queryKey: rentalKeys.bikeSwap.staffDetail(bikeSwapRequestId),
    enabled: enabled && Boolean(bikeSwapRequestId),
    queryFn: async () => {
      const result = await rentalServiceV1.getStaffBikeSwapRequest(bikeSwapRequestId);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}

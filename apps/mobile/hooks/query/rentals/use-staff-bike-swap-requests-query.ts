import type { RentalError } from "@services/rentals";

import { rentalKeys } from "@hooks/query/rentals/rental-query-keys";
import { rentalServiceV1 } from "@services/rentals";
import { useQuery } from "@tanstack/react-query";

import type {
  BikeSwapRequestListParams,
  BikeSwapRequestListResponse,
} from "@/types/rental-types";

export function useStaffBikeSwapRequestsQuery(
  params: BikeSwapRequestListParams = {},
  enabled: boolean = true,
) {
  return useQuery<BikeSwapRequestListResponse, RentalError>({
    queryKey: rentalKeys.bikeSwap.staffList(params),
    enabled,
    queryFn: async () => {
      const result = await rentalServiceV1.listStaffBikeSwapRequests(params);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}

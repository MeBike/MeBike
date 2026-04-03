import { rentalKeys } from "@hooks/query/rentals/rental-query-keys";
import { isRentalApiError, rentalServiceV1 } from "@services/rentals";
import { useQuery } from "@tanstack/react-query";

import type { BikeSwapRequestDetail } from "@/types/rental-types";

type UseMyBikeSwapRequestQueryOptions = {
  rentalId: string;
  requestId?: string;
  enabled?: boolean;
};

export function useMyBikeSwapRequestQuery({
  rentalId,
  requestId,
  enabled = true,
}: UseMyBikeSwapRequestQueryOptions) {
  return useQuery<BikeSwapRequestDetail | null>({
    queryKey: requestId
      ? rentalKeys.bikeSwap.meDetail(requestId)
      : rentalKeys.bikeSwap.meList({ page: 1, pageSize: 20, rentalId }),
    enabled: enabled && Boolean(rentalId),
    queryFn: async () => {
      if (requestId) {
        const result = await rentalServiceV1.getMyBikeSwapRequest(requestId);
        if (result.ok) {
          return result.value;
        }

        if (!isRentalApiError(result.error) || result.error.code !== "BIKE_SWAP_REQUEST_NOT_FOUND") {
          throw result.error;
        }
      }

      const result = await rentalServiceV1.listMyBikeSwapRequests({
        page: 1,
        pageSize: 20,
        rentalId,
      });

      if (!result.ok) {
        throw result.error;
      }

      return result.value.data[0] ?? null;
    },
    refetchInterval: (query) => {
      const hasUnresolvedLookup = Boolean(requestId) && query.state.data === undefined;
      if (hasUnresolvedLookup || query.state.data?.status === "PENDING") {
        return 15 * 1000;
      }

      return false;
    },
    staleTime: 5 * 1000,
  });
}

import { rentalKeys } from "@hooks/query/rentals/rental-query-keys";
import { isRentalApiError, rentalServiceV1 } from "@services/rentals";
import { useQuery } from "@tanstack/react-query";

import type { BikeSwapRequestDetail } from "@/types/rental-types";

type UseMyBikeSwapRequestQueryOptions = {
  rentalId: string;
  requestId?: string;
  enabled?: boolean;
  keepPollingWhenMissing?: boolean;
};

export function useMyBikeSwapRequestQuery({
  rentalId,
  requestId,
  enabled = true,
  keepPollingWhenMissing = false,
}: UseMyBikeSwapRequestQueryOptions) {
  const detailQuery = useQuery<BikeSwapRequestDetail | null>({
    queryKey: rentalKeys.bikeSwap.meDetail(requestId ?? null),
    enabled: enabled && Boolean(requestId),
    queryFn: async () => {
      if (!requestId) {
        return null;
      }

      const result = await rentalServiceV1.getMyBikeSwapRequest(requestId!);
      if (result.ok) {
        return result.value;
      }

      if (!isRentalApiError(result.error) || result.error.code !== "BIKE_SWAP_REQUEST_NOT_FOUND") {
        throw result.error;
      }

      return null;
    },
    refetchInterval: (query) => {
      const shouldKeepPollingWithoutResult = keepPollingWhenMissing && query.state.data === null;

      if (shouldKeepPollingWithoutResult || query.state.data?.status === "PENDING") {
        return 15 * 1000;
      }

      return false;
    },
    staleTime: 5 * 1000,
  });

  const rentalQuery = useQuery<BikeSwapRequestDetail | null>({
    queryKey: rentalKeys.bikeSwap.meList({ page: 1, pageSize: 20, rentalId }),
    enabled: enabled && Boolean(rentalId) && (!requestId || detailQuery.data === null),
    queryFn: async () => {
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
      const shouldKeepPollingWithoutResult = keepPollingWhenMissing && query.state.data === null;

      if (shouldKeepPollingWithoutResult || query.state.data?.status === "PENDING") {
        return 15 * 1000;
      }

      return false;
    },
    staleTime: 5 * 1000,
  });

  return {
    data: detailQuery.data ?? rentalQuery.data ?? null,
    isRefetching: detailQuery.isRefetching || rentalQuery.isRefetching,
    refetch: async () => {
      await Promise.all([
        requestId ? detailQuery.refetch() : Promise.resolve(),
        rentalQuery.refetch(),
      ]);
    },
  };
}

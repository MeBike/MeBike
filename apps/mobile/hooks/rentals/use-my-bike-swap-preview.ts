import { rentalKeys } from "@hooks/query/rentals/rental-query-keys";
import { useAuthNext } from "@providers/auth-provider-next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import type { BikeSwapStatus } from "@/types/rental-types";

export type MyBikeSwapPreview = {
  requestId: string;
  oldBikeId: string;
  stationId: string;
  stationName: string;
  status: BikeSwapStatus;
};

export function useMyBikeSwapPreview(rentalId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuthNext();
  const queryKey = rentalKeys.bikeSwap.mePreview(user?.id, rentalId);

  const previewQuery = useQuery<MyBikeSwapPreview | null>({
    queryKey,
    queryFn: async () => null,
    enabled: false,
    initialData: null,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 1000 * 60 * 30,
  });

  const setPendingPreview = useCallback(
    (preview: Omit<MyBikeSwapPreview, "status">) => {
      queryClient.setQueryData<MyBikeSwapPreview>(queryKey, {
        ...preview,
        status: "PENDING",
      });
    },
    [queryClient, queryKey],
  );

  const setPreviewStatus = useCallback(
    (status: BikeSwapStatus) => {
      queryClient.setQueryData<MyBikeSwapPreview | null>(queryKey, current => current
        ? {
            ...current,
            status,
          }
        : current);
    },
    [queryClient, queryKey],
  );

  const clearPreview = useCallback(() => {
    queryClient.setQueryData(queryKey, null);
  }, [queryClient, queryKey]);

  return {
    preview: previewQuery.data,
    setPendingPreview,
    setPreviewStatus,
    clearPreview,
  };
}

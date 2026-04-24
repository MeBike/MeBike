import { useCallback, useEffect, useState } from "react";

import { useMyRentalResolvedDetailQuery } from "@hooks/query/rentals/use-my-rental-resolved-detail-query";
import { useAuthNext } from "@providers/auth-provider-next";

type Options = {
  onRentalEnd?: () => void;
};

export function useRentalDetailData(bookingId: string, options?: Options) {
  const { onRentalEnd } = options || {};
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isAuthenticated, user } = useAuthNext();

  const rentalQuery = useMyRentalResolvedDetailQuery(bookingId, isAuthenticated, user?.id);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await rentalQuery.refetch();
    }
    finally {
      setIsRefreshing(false);
    }
  }, [rentalQuery]);

  useEffect(() => {
    if (rentalQuery.data?.rental.status === "COMPLETED") {
      onRentalEnd?.();
    }
  }, [onRentalEnd, rentalQuery.data?.rental.status]);

  return {
    detail: rentalQuery.data,
    booking: rentalQuery.data?.rental,
    isInitialLoading: rentalQuery.isLoading,
    isError: rentalQuery.isError,
    isRefreshing,
    onRefresh: refreshAll,
    refetchDetail: rentalQuery.refetch,
  };
}

import { useCallback, useEffect, useState } from "react";

import { useMyRentalResolvedDetailQuery } from "@hooks/query/rentals/use-my-rental-resolved-detail-query";

type Options = {
  onRentalEnd?: () => void;
};

export function useRentalDetailData(bookingId: string, options?: Options) {
  const { onRentalEnd } = options || {};
  const [isRefreshing, setIsRefreshing] = useState(false);

  const rentalQuery = useMyRentalResolvedDetailQuery(bookingId, true);

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

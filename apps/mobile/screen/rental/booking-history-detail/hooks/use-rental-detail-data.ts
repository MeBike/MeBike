import { useCallback, useEffect, useState } from "react";

import { useMyRentalBillingDetailQuery } from "@hooks/query/rentals/use-my-rental-billing-detail-query";
import { useMyRentalBillingPreviewQuery } from "@hooks/query/rentals/use-my-rental-billing-preview-query";
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
  const rentalStatus = rentalQuery.data?.rental.status;
  const billingPreviewQuery = useMyRentalBillingPreviewQuery(
    bookingId,
    isAuthenticated && rentalStatus === "RENTED",
    user?.id,
  );
  const billingDetailQuery = useMyRentalBillingDetailQuery(
    bookingId,
    isAuthenticated && rentalStatus === "COMPLETED",
    user?.id,
  );

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        rentalQuery.refetch(),
        rentalStatus === "RENTED" ? billingPreviewQuery.refetch() : Promise.resolve(),
        rentalStatus === "COMPLETED" && !billingDetailQuery.data ? billingDetailQuery.refetch() : Promise.resolve(),
      ]);
    }
    finally {
      setIsRefreshing(false);
    }
  }, [billingDetailQuery, billingPreviewQuery, rentalQuery, rentalStatus]);

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
    billing: {
      detail: billingDetailQuery.data,
      isError: billingPreviewQuery.isError || billingDetailQuery.isError,
      isLoading: billingPreviewQuery.isLoading || billingDetailQuery.isLoading,
      isRefetching: billingPreviewQuery.isRefetching || billingDetailQuery.isRefetching,
      preview: billingPreviewQuery.data,
      refetchDetail: billingDetailQuery.refetch,
      refetchPreview: billingPreviewQuery.refetch,
    },
  };
}

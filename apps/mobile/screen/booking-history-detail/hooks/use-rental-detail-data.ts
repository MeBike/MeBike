import { useMyRentalQuery } from "@hooks/query/rentals/use-my-rental-query";
import { useStationActions } from "@hooks/useStationAction";
import { useWalletActions } from "@hooks/useWalletAction";
import { useCallback, useEffect, useState } from "react";

import type { Rental } from "@/types/rental-types";

type Options = {
  onRentalEnd?: () => void;
};

export function useRentalDetailData(bookingId: string, options?: Options) {
  const { onRentalEnd } = options || {};
  const { getMyWallet } = useWalletActions(true);
  const { stations, isLoadingGetAllStations, refetch: refetchStations }
    = useStationActions(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const rentalQuery = useMyRentalQuery(bookingId, true);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        rentalQuery.refetch(),
        getMyWallet(),
        refetchStations(),
      ]);
    }
    finally {
      setIsRefreshing(false);
    }
  }, [getMyWallet, refetchStations, rentalQuery]);

  useEffect(() => {
    getMyWallet();
    refetchStations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const booking = rentalQuery.data as Rental | undefined;
  const isInitialLoading = rentalQuery.isLoading || isLoadingGetAllStations;

  useEffect(() => {
    if (booking?.status === "COMPLETED") {
      onRentalEnd?.();
    }
  }, [booking?.status, onRentalEnd]);

  return {
    booking,
    stations,
    isInitialLoading,
    isError: rentalQuery.isError,
    isRefreshing,
    onRefresh: refreshAll,
    refetchDetail: rentalQuery.refetch,
  };
}

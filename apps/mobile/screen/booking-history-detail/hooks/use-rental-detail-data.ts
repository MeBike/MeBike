import { useCallback, useEffect, useState } from "react";
import type { MutableRefObject } from "react";

import { useRentalsActions } from "@hooks/useRentalAction";
import { useStationActions } from "@hooks/useStationAction";
import { useWalletActions } from "@hooks/useWalletAction";

import type { RentalDetail } from "@/types/RentalTypes";

type Options = {
  onRentalEndRef?: MutableRefObject<(() => void) | undefined>;
};

export function useRentalDetailData(bookingId: string, options?: Options) {
  const { onRentalEndRef } = options || {};
  const { getMyWallet } = useWalletActions(true);
  const { isLoadingGetAllStations, refetch: refetchStations } =
    useStationActions(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    useGetDetailRental,
    rentalDetailData,
    isGetDetailRentalFetching,
    isGetDetailRentalError,
  } = useRentalsActions(true, bookingId, undefined, () => {
    onRentalEndRef?.current?.();
  });

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        useGetDetailRental(),
        getMyWallet(),
        refetchStations(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [useGetDetailRental, getMyWallet, refetchStations]);

  useEffect(() => {
    useGetDetailRental();
    getMyWallet();
    refetchStations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const booking = rentalDetailData?.data?.result as RentalDetail | undefined;
  const isInitialLoading = isGetDetailRentalFetching || isLoadingGetAllStations;

  return {
    booking,
    isInitialLoading,
    isError: isGetDetailRentalError,
    isRefreshing,
    onRefresh: refreshAll,
    refetchDetail: useGetDetailRental,
  };
}


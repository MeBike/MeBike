import { rentalKeys } from "@hooks/query/rentals/rental-query-keys";
import { useAuthNext } from "@providers/auth-provider-next";
import { rentalServiceV1 } from "@services/rentals";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import type { Rental } from "@/types/rental-types";

const PAGE_SIZE = 10;

async function fetchRentalHistory(page: number = 1) {
  const result = await rentalServiceV1.listMyRentals({ page, pageSize: PAGE_SIZE });
  if (!result.ok) {
    throw result.error;
  }
  return result.value;
}

export function useBookingHistory() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isAuthenticated, user } = useAuthNext();

  const query = useInfiniteQuery({
    queryKey: rentalKeys.meHistoryPage(user?.id, PAGE_SIZE),
    enabled: isAuthenticated,
    queryFn: ({ pageParam = 1 }) =>
      fetchRentalHistory(pageParam as number),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
  });
  const {
    data,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isLoading,
    isRefetching,
  } = query;

  const bookings = useMemo(() => {
    if (!data?.pages) {
      return [];
    }
    const seenIds = new Set<string>();
    const unique: Rental[] = [];

    data.pages.forEach((page) => {
      page.data.forEach((item) => {
        if (item && !seenIds.has(item.id)) {
          seenIds.add(item.id);
          unique.push(item);
        }
      });
    });

    return unique;
  }, [data]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    }
    finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return {
    bookings,
    isLoading: isLoading && !data,
    isFetchingNextPage,
    hasNextPage,
    refreshing: isRefreshing || isRefetching,
    onRefresh,
    loadMore,
  };
}

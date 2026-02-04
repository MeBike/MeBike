import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import { rentalServiceV1 } from "@services/rentals";

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

  const query = useInfiniteQuery({
    queryKey: ["rentals", "me", "history", PAGE_SIZE],
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

  const bookings = useMemo(() => {
    if (!query.data?.pages) {
      return [];
    }
    const seenIds = new Set<string>();
    const unique: Rental[] = [];

    query.data.pages.forEach((page) => {
      page.data.forEach((item) => {
        if (item && !seenIds.has(item.id)) {
          seenIds.add(item.id);
          unique.push(item);
        }
      });
    });

    return unique;
  }, [query.data]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await query.refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [query]);

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

  return {
    bookings,
    isLoading: query.isLoading && !query.data,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    refreshing: isRefreshing || query.isRefetching,
    onRefresh,
    loadMore,
  };
}

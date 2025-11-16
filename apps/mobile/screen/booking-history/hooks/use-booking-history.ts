import { rentalService } from "@services/rental.service";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import type { RentingHistory } from "../../../types/RentalTypes";

type RentalHistoryPage = {
  data: RentingHistory[];
  pagination: {
    totalPages: number;
    currentPage: number;
    limit: number;
    totalRecords: number;
  };
};

const PAGE_SIZE = 10;

async function fetchRentalHistory(
  page: number = 1,
  limit: number = PAGE_SIZE
): Promise<RentalHistoryPage> {
  const response = await rentalService.userGetAllRentals(page, limit);
  if (response.status === 200) {
    return response.data as unknown as RentalHistoryPage;
  }
  throw new Error("Failed to fetch rental history");
}

export function useBookingHistory() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const query = useInfiniteQuery({
    queryKey: ["rentalsHistory"],
    queryFn: ({ pageParam = 1 }) =>
      fetchRentalHistory(pageParam as number, PAGE_SIZE),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.currentPage < lastPage.pagination.totalPages) {
        return lastPage.pagination.currentPage + 1;
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
    const unique: RentingHistory[] = [];

    query.data.pages.forEach((page) => {
      page.data.forEach((item) => {
        if (item && !seenIds.has(item._id)) {
          seenIds.add(item._id);
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

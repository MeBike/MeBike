import type { BikeError } from "@services/bike-error";
import type { InfiniteData } from "@tanstack/react-query";

import { bikeService } from "@services/bike.service";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import type { BikeSummary } from "@/contracts/server";

type StationBikePage = {
  data: BikeSummary[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

type UseStationBikesArgs = {
  pageSize: number;
  stationId: string;
};

async function fetchStationBikes({ page, pageSize, stationId }: {
  page: number;
  pageSize: number;
  stationId: string;
}): Promise<StationBikePage> {
  const result = await bikeService.getAllBikes({
    page,
    pageSize,
    stationId,
    status: "AVAILABLE",
  });

  if (!result.ok) {
    throw result.error;
  }

  return result.value;
}

export function useStationBikes({ pageSize, stationId }: UseStationBikesArgs) {
  const query = useInfiniteQuery<
    StationBikePage,
    BikeError,
    InfiniteData<StationBikePage, number>,
    readonly [string, string, number],
    number
  >({
    enabled: Boolean(stationId),
    getNextPageParam: lastPage => (
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined
    ),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchStationBikes({
      page: pageParam,
      pageSize,
      stationId,
    }),
    queryKey: ["station-bikes", stationId, pageSize] as const,
    staleTime: 3 * 60 * 1000,
  });

  const bikes = useMemo(
    () => query.data?.pages.flatMap(page => page.data) ?? [],
    [query.data?.pages],
  );

  const totalRecords = query.data?.pages[0]?.pagination.total ?? 0;

  const loadMore = useCallback(() => {
    if (!query.hasNextPage || query.isFetchingNextPage) {
      return;
    }

    void query.fetchNextPage();
  }, [query.fetchNextPage, query.hasNextPage, query.isFetchingNextPage]);

  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query.refetch]);

  return {
    bikes,
    hasMore: Boolean(query.hasNextPage),
    isFetchingMore: query.isFetchingNextPage,
    isLoadingBikes: query.isLoading,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    loadMore,
    refresh,
    totalRecords,
  };
}

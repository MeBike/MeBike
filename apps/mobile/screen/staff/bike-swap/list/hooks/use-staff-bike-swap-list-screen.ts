import { useCallback, useMemo, useState } from "react";

import type { BikeSwapRequestDetail } from "@/types/rental-types";

import { useStaffBikeSwapRequestsQuery } from "@/hooks/query/rentals/use-staff-bike-swap-requests-query";

export type StaffBikeSwapTab = "PENDING" | "HISTORY";

function sortPendingRequests(a: BikeSwapRequestDetail, b: BikeSwapRequestDetail) {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

function sortHistoryRequests(a: BikeSwapRequestDetail, b: BikeSwapRequestDetail) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

export function useStaffBikeSwapListScreen() {
  const [activeTab, setActiveTab] = useState<StaffBikeSwapTab>("PENDING");

  const allRequestsQuery = useStaffBikeSwapRequestsQuery({
    page: 1,
    pageSize: 50,
    sortBy: "updatedAt",
    sortDir: "desc",
  });

  const pendingCountQuery = useStaffBikeSwapRequestsQuery({
    status: "PENDING",
    page: 1,
    pageSize: 1,
    sortBy: "createdAt",
    sortDir: "asc",
  });

  const requests = allRequestsQuery.data?.data ?? [];

  const pendingRequests = useMemo(
    () => requests.filter(request => request.status === "PENDING").sort(sortPendingRequests),
    [requests],
  );

  const historyRequests = useMemo(
    () => requests.filter(request => request.status !== "PENDING").sort(sortHistoryRequests),
    [requests],
  );

  const visibleRequests = activeTab === "PENDING" ? pendingRequests : historyRequests;
  const pendingCount = pendingCountQuery.data?.pagination.total ?? pendingRequests.length;

  const handleRefresh = useCallback(async () => {
    await Promise.all([allRequestsQuery.refetch(), pendingCountQuery.refetch()]);
  }, [allRequestsQuery, pendingCountQuery]);

  return {
    activeTab,
    handleRefresh,
    isError: allRequestsQuery.isError,
    isInitialLoading: allRequestsQuery.isLoading && !allRequestsQuery.data,
    isRefreshing: allRequestsQuery.isRefetching || pendingCountQuery.isRefetching,
    pendingCount,
    setActiveTab,
    visibleRequests,
  };
}

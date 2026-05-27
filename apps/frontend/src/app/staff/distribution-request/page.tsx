"use client";

import { useEffect, useState, useCallback } from "react";
import { useDistributionRequest } from "@/hooks/use-distribution-request";
import DistributionRequestClient from "./client";
import { RedistributionRequestStatus } from "@/types/DistributionRequest";
import { useStationActions } from "@/hooks/use-station";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { useSystemConfigActions } from "@/hooks/use-system-config";
export default function Page() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<
    RedistributionRequestStatus | "all"
  >("all");
  const pageSize = 10;
  const { listStation, getListStation, isLoadingListStation } =
    useStationActions({ hasToken: true });
  const {
    staffViewDistributionRequest,
    isFetchingStaffViewDistributionRequest,
    getStaffViewDistributionRequest,
  } = useDistributionRequest({
    page,
    pageSize,
    status: statusFilter === "all" ? undefined : statusFilter,
    hasToken: true,
  });
    const { systemConfigs, getAllSystemConfigs, isLoading } =
      useSystemConfigActions({ hasToken: true });
  useEffect(() => {
    getStaffViewDistributionRequest();
    getAllSystemConfigs();
  }, [page, statusFilter, getStaffViewDistributionRequest,getAllSystemConfigs]);

  useEffect(() => {
    getListStation();
  }, [getListStation]);
  const handleReset = () => {
    setStatusFilter("all");
    setPage(1);
  };
  const requests = staffViewDistributionRequest?.data?.data || [];

  if (isLoadingListStation || !listStation || isLoading) {
    return <LoadingScreen />;
  }
  const minBikes = Number(
    systemConfigs?.find(
      (item) => item.key === "min_available_bikes_at_station",
    )?.value || 0,
  );
  return (
    <DistributionRequestClient
      data={{
        listStation: listStation,
        minBikeAtStation : Number(minBikes),
        requests: requests,
        pagination: staffViewDistributionRequest?.data.pagination,
        isVisualLoading: isFetchingStaffViewDistributionRequest,
      }}
      filters={{
        statusFilter,
        page,
      }}
      actions={{
        setStatusFilter,
        setPage,
        handleReset, // Truyền thêm action reset
      }}
    />
  );
}

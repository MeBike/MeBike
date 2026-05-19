"use client";

import { useEffect, useState, useCallback } from "react";
import { useDistributionRequest } from "@/hooks/use-distribution-request";
import DistributionRequestClient from "./client";
import { RedistributionRequestStatus } from "@/types/DistributionRequest";
import { useStationActions } from "@/hooks/use-station";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
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
  useEffect(() => {
    getStaffViewDistributionRequest();
  }, [page, statusFilter, getStaffViewDistributionRequest]);

  useEffect(() => {
    getListStation();
  }, [getListStation]);
  const handleReset = () => {
    setStatusFilter("all");
    setPage(1);
  };
  const requests = staffViewDistributionRequest?.data?.data || [];

  if (isLoadingListStation || !listStation) {
    return <LoadingScreen />;
  }

  return (
    <DistributionRequestClient
      data={{
        listStation: listStation,
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

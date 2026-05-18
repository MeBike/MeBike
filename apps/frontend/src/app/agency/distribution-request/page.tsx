"use client";
import { useEffect, useState } from "react";
import { useDistributionRequest } from "@/hooks/use-distribution-request";
import DistributionRequestClient from "./client";
import { RedistributionRequestStatus } from "@/types/DistributionRequest";
import { useDebounce } from "@/utils/useDebounce";
import { useStationActions } from "@/hooks/use-station";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
export default function Page() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<
    RedistributionRequestStatus | "all"
  >("all");
  const pageSize = 10;
  const debouncedStatusFilter = useDebounce(statusFilter, 500);
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(true);
  const { listStation, getListStation, isLoadingListStation } =
      useStationActions({ hasToken: true });
  const {
    agencyViewDistributionRequest,
    isFetchingAgencyViewDistributionRequest,
    getAgencyViewDistributionRequest,
  } = useDistributionRequest({
    page,
    pageSize,
    status: debouncedStatusFilter === "all" ? undefined : debouncedStatusFilter,
    hasToken: true,
  });

  useEffect(() => {
    getAgencyViewDistributionRequest();
  }, [page, debouncedStatusFilter, getAgencyViewDistributionRequest]);
  const requests = agencyViewDistributionRequest?.data || [];
  useEffect(() => {
    if (isFetchingAgencyViewDistributionRequest) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isFetchingAgencyViewDistributionRequest]);
  useEffect(() => {
    getListStation();
  }, [getListStation]);

  if (isVisualLoading || isLoadingListStation || !listStation) {
    return <LoadingScreen />;
  }

  return (
    <DistributionRequestClient
      data={{
        listStation: listStation,
        requests: requests,
        pagination: agencyViewDistributionRequest?.pagination,
        isVisualLoading: isFetchingAgencyViewDistributionRequest,
      }}
      filters={{
        statusFilter,
        page,
      }}
      actions={{
        setStatusFilter,
        setPage,
      }}
    />
  );
}

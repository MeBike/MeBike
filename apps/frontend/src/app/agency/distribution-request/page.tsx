"use client";
import { useEffect, useState } from "react";
import { useDistributionRequest } from "@/hooks/use-distribution-request";
import DistributionRequestClient from "./client";
import { RedistributionRequestStatus } from "@/types/DistributionRequest";
import { useDebounce } from "@/utils/useDebounce";
import { useStationActions } from "@/hooks/use-station";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { useSystemConfigActions } from "@/hooks/use-system-config";
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
    const { systemConfigs, getAllSystemConfigs, isLoading } =
        useSystemConfigActions({ hasToken: true });
  useEffect(() => {
    getAgencyViewDistributionRequest();
    getAllSystemConfigs();
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
  const minAvailableBikeAtStation = Number(
    systemConfigs?.find(
      (item) => item.key === "min_available_bikes_at_station",
    )?.value || 0,
  );
  return (
    <DistributionRequestClient
      data={{
        minAvailableBikeAtStation:minAvailableBikeAtStation,
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

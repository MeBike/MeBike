"use client";

import { useEffect, useState } from "react";
import { useDistributionRequest } from "@/hooks/use-distribution-request";
import DistributionRequestClient from "./client";
import { RedistributionRequestStatus } from "@/types/DistributionRequest";
import { useStationActions } from "@/hooks/use-station";

export default function Page() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<RedistributionRequestStatus | "all">("all");
  const pageSize = 10;
  const { 
    agencyViewDistributionRequest, 
    isFetchingAgencyViewDistributionRequest,
    getAgencyViewDistributionRequest
  } = useDistributionRequest({
    page,
    pageSize,
    status: statusFilter === "all" ? undefined : statusFilter,
    hasToken: true,
  });
  useEffect(() => {
    getAgencyViewDistributionRequest();
  }, [page, statusFilter, getAgencyViewDistributionRequest]); 
  const requests = agencyViewDistributionRequest?.data || [];
  return (
    <DistributionRequestClient
      data={{
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
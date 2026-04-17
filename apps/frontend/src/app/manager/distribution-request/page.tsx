"use client";

import { useEffect, useState } from "react";
import { useDistributionRequest } from "@/hooks/use-distribution-request";
import DistributionRequestClient from "./client";
import { RedistributionRequestStatus } from "@/types/DistributionRequest";

export default function Page() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<RedistributionRequestStatus | "all">("all");
  const pageSize = 10;
  const { 
    managerViewDistributionRequest, 
    isFetchingManagerViewDistributionRequest,
    getManagerViewDistributionRequest
  } = useDistributionRequest({
    page,
    pageSize,
    status: statusFilter === "all" ? undefined : statusFilter,
    hasToken: true,
  });
  useEffect(() => {
    getManagerViewDistributionRequest();
  },[page,pageSize])
  const requests = managerViewDistributionRequest?.data?.data || [];
  return (
    <DistributionRequestClient
      data={{
        requests: requests,
        pagination: managerViewDistributionRequest?.data.pagination,
        isVisualLoading: isFetchingManagerViewDistributionRequest,
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
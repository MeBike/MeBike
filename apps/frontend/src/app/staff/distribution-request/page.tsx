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
    staffViewDistributionRequest, 
    isFetchingStaffViewDistributionRequest,
    getStaffViewDistributionRequest
  } = useDistributionRequest({
    page,
    pageSize,
    status: statusFilter === "all" ? undefined : statusFilter,
    hasToken: true,
  });

  // Cập nhật dependency để gọi lại API khi Page hoặc Status thay đổi
  useEffect(() => {
    getStaffViewDistributionRequest();
  }, [page, statusFilter, getStaffViewDistributionRequest]); 

  const requests = staffViewDistributionRequest?.data?.data || [];

  return (
    <DistributionRequestClient
      data={{
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
      }}
    />
  );
}
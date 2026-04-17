"use client";

import { useEffect, useState } from "react";
import { useDistributionRequest } from "@/hooks/use-distribution-request";
import DistributionRequestClient from "./client";
import { RedistributionRequestStatus } from "@/types/DistributionRequest";

export default function Page() {
  // 1. Quản lý filters
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<RedistributionRequestStatus | "all">("all");
  const pageSize = 10;

  // 2. Lấy dữ liệu từ Hook (Sử dụng view của Admin)
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
  useEffect(() => {
    getStaffViewDistributionRequest();
  },[page,pageSize])
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
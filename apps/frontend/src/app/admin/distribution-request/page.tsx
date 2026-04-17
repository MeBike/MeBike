"use client";

import { useState } from "react";
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
    adminViewDistributionRequest, 
    isFetchingAdminViewDistributionRequest 
  } = useDistributionRequest({
    page,
    pageSize,
    status: statusFilter === "all" ? undefined : statusFilter,
    hasToken: true, // Giả định đã handle token ở level cao hơn hoặc trong logic hook
  });

  // 3. Chuẩn bị dữ liệu để truyền xuống Client Component
  const requests = adminViewDistributionRequest?.data?.data || [];
  const pagination = adminViewDistributionRequest?.data?.pagination || {
    page: 1,
    totalPages: 1,
    totalElements: 0
  };

  return (
    <DistributionRequestClient
      data={{
        requests: requests,
        pagination: adminViewDistributionRequest?.data.pagination,
        isVisualLoading: isFetchingAdminViewDistributionRequest,
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
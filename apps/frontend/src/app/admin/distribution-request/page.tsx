// Trong file Page quản lý Distribution Request
"use client";

import { useState , useEffect} from "react";
import DistributionRequestClient from "./client";
import { useDistributionRequest } from "@/hooks/use-distribution-request"; // Tên hook của bạn
import { useStationActions } from "@/hooks/use-station";
import { RedistributionRequestStatus } from "@/types/DistributionRequest";

export default function Page() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<RedistributionRequestStatus | "all">("all");
  const [requestedByUserId, setRequestedByUserId] = useState("");
  const [sourceStationId, setSourceStationId] = useState("");
  const [targetStationId, setTargetStationId] = useState("");

  const { stations } = useStationActions({ hasToken: true });
  
  const { adminViewDistributionRequest, isFetchingAdminViewDistributionRequest, getAdminViewDistributionRequest } = useDistributionRequest({
    hasToken: true,
    page,
    pageSize: 7,
    status: statusFilter === "all" ? undefined : statusFilter,
    requestedByUserId : requestedByUserId || undefined,
    sourceStationId : sourceStationId || undefined,
    targetStationId : targetStationId || undefined,
  });
  useEffect(() => {
    getAdminViewDistributionRequest();
  }, [page, statusFilter, requestedByUserId, sourceStationId, targetStationId, getAdminViewDistributionRequest]); 

  const handleReset = () => {
    setStatusFilter("all");
    setPage(1);
    setRequestedByUserId("");
    setSourceStationId("");
    setTargetStationId("");
  };

  return (
    <DistributionRequestClient
      data={{
        requests: adminViewDistributionRequest?.data?.data || [],
        pagination: adminViewDistributionRequest?.data.pagination,
        isVisualLoading: isFetchingAdminViewDistributionRequest,
        stations: stations || [],
      }}
      filters={{
        page,
        statusFilter,
        requestedByUserId,
        sourceStationId,
        targetStationId,
      }}
      actions={{
        setPage,
        setStatusFilter,
        setRequestedByUserId,
        setSourceStationId,
        setTargetStationId,
        handleReset,
      }}
    />
  );
}
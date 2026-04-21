"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useDistributionRequest } from "@/hooks/use-distribution-request";
import { DistributionRequestDetailClient } from "./client";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
const DistributionRequestDetailPage = () => {
  const params = useParams();
  const id = params.id as string;
  const hasToken = true;
  const {
    staffViewDistributionRequestDetail,
    isLoadingStaffViewDistributionRequestDetail,
    getStaffViewDistributionRequestDetail,
    startTransitDistributionRequest,
    cancelDistributeRequest,
  } = useDistributionRequest({
    id: id,
    hasToken: hasToken,
  });
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(false);
  useEffect(() => {
    if (isLoadingStaffViewDistributionRequestDetail) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingStaffViewDistributionRequestDetail]);
  useEffect(() => {
    if (id) {
      getStaffViewDistributionRequestDetail();
    }
  }, [id, getStaffViewDistributionRequestDetail]);

  if (isVisualLoading) {
    return <LoadingScreen />;
  }
  if (!staffViewDistributionRequestDetail?.data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Không tìm thấy thông tin yêu cầu điều phối.</p>
      </div>
    );
  }

  return (
    <DistributionRequestDetailClient
      onCancel={async (reason: string) =>
        await cancelDistributeRequest(id, { reason })
      }
      data={staffViewDistributionRequestDetail.data}
      onStartTransit={async () => await startTransitDistributionRequest(id)}
    />
  );
};

export default DistributionRequestDetailPage;

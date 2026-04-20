"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useDistributionRequest } from "@/hooks/use-distribution-request";
import { DistributionRequestDetailClient } from "./client";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";

const DistributionRequestDetailPage = () => {
  const params = useParams();
  const id = params.id as string;
  const {
    managerViewDistributionRequestDetail,
    isLoadingManagerViewDistributionRequestDetail,
    getManagerViewDistributionRequestDetail,
    approveDistributeRequest,
    rejectDistributeRequest,
    completeDistributeRequest
  } = useDistributionRequest({
    id: id,
    hasToken: true,
  });

  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isLoadingManagerViewDistributionRequestDetail) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingManagerViewDistributionRequestDetail]);

  useEffect(() => {
    if (id) {
      getManagerViewDistributionRequestDetail();
    }
  }, [id, getManagerViewDistributionRequestDetail]);

  if (isVisualLoading) {
    return <LoadingScreen />;
  }

  if (!managerViewDistributionRequestDetail?.data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Không tìm thấy thông tin yêu cầu điều phối.</p>
      </div>
    );
  }

  return (
    <DistributionRequestDetailClient 
      data={managerViewDistributionRequestDetail.data}
      onApprove={() => approveDistributeRequest(id)}
      onReject={(reason: string) => rejectDistributeRequest(id, { reason })}
      onComplete={(payload) => completeDistributeRequest(id, { completedBikeIds: payload.completedBikeIds })}
    />
  );
};

export default DistributionRequestDetailPage;
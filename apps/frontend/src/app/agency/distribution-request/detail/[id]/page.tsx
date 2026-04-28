"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useDistributionRequest } from "@/hooks/use-distribution-request";
import { DistributionRequestDetailClient } from "./client";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { useStationActions } from "@/hooks/use-station";
const DistributionRequestDetailPage = () => {
  const params = useParams();
  const id = params.id as string;
  const {
    agencyViewDistributionRequestDetail,
    isLoadingAgencyViewDistributionRequestDetail,
    getAgencyViewDistributionRequestDetail,
    startTransitDistributionRequest,
    cancelDistributeRequest,
    approveDistributeRequest,
    rejectDistributeRequest,
    completeDistributeRequest,
  } = useDistributionRequest({
    id: id,
    hasToken: true,
  });
  const { getListStation, listStation, isLoadingListStation } = useStationActions({
      hasToken: true,
    });
  
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isLoadingAgencyViewDistributionRequestDetail) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingAgencyViewDistributionRequestDetail]);

  useEffect(() => {
    if (id) {
      getAgencyViewDistributionRequestDetail();
      getListStation();
    }
  }, [id, getAgencyViewDistributionRequestDetail]);

  if (isVisualLoading) {
    return <LoadingScreen />;
  }

  if (!agencyViewDistributionRequestDetail?.data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Không tìm thấy thông tin yêu cầu điều phối.</p>
      </div>
    );
  }
  
  return (
    <DistributionRequestDetailClient 
      listStation={listStation}
      data={agencyViewDistributionRequestDetail.data}
      onApprove={() => approveDistributeRequest(id)}
      onReject={(reason: string) => rejectDistributeRequest(id, { reason })}
      onComplete={(payload) => completeDistributeRequest(id, { completedBikeIds: payload.completedBikeIds })}
      onStartTransit={async () => await startTransitDistributionRequest(id)}
      onCancel={async (reason: string) =>
        await cancelDistributeRequest(id, { reason })
      }
    />
  );
};

export default DistributionRequestDetailPage;
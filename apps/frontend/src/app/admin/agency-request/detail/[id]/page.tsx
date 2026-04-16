"use client";

import React, { useEffect, useState } from "react";
import AgencyRequestDetailClient from "./AgencyRequestDetail";
import { useAgencyActions } from "@/hooks/use-agency";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const {
    agencyRequestDetail,
    isLoadingAgencyRequestDetail,
    approveAgencyRequest,
    rejectAgencyRequest,
    getAgencyRequestDetail,
  } = useAgencyActions({
    hasToken: true,
    agency_request_id: id,
  });
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(true);
  useEffect(() => {
    if (id) {
      getAgencyRequestDetail();
    }
  }, [id, getAgencyRequestDetail]);
  useEffect(() => {
    if (isLoadingAgencyRequestDetail) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingAgencyRequestDetail]);
  if (!agencyRequestDetail) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <p className="text-muted-foreground">
          Không tìm thấy thông tin người dùng.
        </p>
      </div>
    );
  }
  if (isVisualLoading) {
    return <LoadingScreen />;
  }
  return (
    <AgencyRequestDetailClient
      id={id}
      data={agencyRequestDetail}
      isLoading={isLoadingAgencyRequestDetail}
      onApprove={approveAgencyRequest}
      onReject={rejectAgencyRequest}
    />
  );
}

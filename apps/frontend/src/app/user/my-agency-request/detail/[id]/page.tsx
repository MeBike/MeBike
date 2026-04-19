"use client";

import React, { useEffect, useState } from "react";
import AgencyRequestDetailClient from "./AgencyRequestDetail";
import { useAgencyActions } from "@/hooks/use-agency";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const {
    myAgencyRequestDetail,
    isLoadingMyAgencyRequestDetail,
    getMyAgencyRequestDetail,
    cancelAgencyRequest,
  } = useAgencyActions({
    hasToken: true,
    agency_request_id: id,
  });
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(true);
  useEffect(() => {
    if (id) {
      getMyAgencyRequestDetail();
    }
  }, [id, getMyAgencyRequestDetail]);
  useEffect(() => {
    if (isLoadingMyAgencyRequestDetail) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingMyAgencyRequestDetail]);
  if (isVisualLoading) {
    return <LoadingScreen />;
  }
  if (!myAgencyRequestDetail) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <p className="text-muted-foreground">
          Không tìm thấy thông tin người dùng.
        </p>
      </div>
    );
  }
  return (
    <AgencyRequestDetailClient
      id={id}
      onCancel={() => cancelAgencyRequest({ id })}
      data={myAgencyRequestDetail}
      isLoading={isLoadingMyAgencyRequestDetail}
    />
  );
}

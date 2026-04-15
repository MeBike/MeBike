"use client";
import React, { useState, useEffect } from "react";
import AgencyClient from "./AgencyClient";
import { useAgencyActions } from "@/hooks/use-agency";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
export default function Page() {
  const [page, setPage] = useState(1);
  const { agencies, isLoadingAgencies, getAgencies } = useAgencyActions({
    hasToken: true,
    pageSize: 7,
    page: page,
  });
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(false);
  useEffect(() => {
    if (isLoadingAgencies) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingAgencies]);
  useEffect(() => {
    getAgencies();
  }, [getAgencies]);
  if (isVisualLoading) {
    return <LoadingScreen />;
  }
  if (agencies) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <p className="text-muted-foreground">
          Không tìm thấy thông tin agency.
        </p>
      </div>
    );
  }
  return (
    <>
      <AgencyClient
        agencies={agencies}
        isVisualLoading={isVisualLoading}
        setPage={setPage}
      />
    </>
  );
}

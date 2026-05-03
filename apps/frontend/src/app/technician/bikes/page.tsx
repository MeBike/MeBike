"use client";

import { useState, useEffect } from "react";
import BikeClient from "./BikeClient";
import { useBikeActions } from "@/hooks/use-bike";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { BikeStatus } from "@custom-types";

export default function Page() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<BikeStatus | "all">("all");
  const pageSize = 7;

  const {
    myBikeInStation,
    isLoadingMyBikeInStation,
    getMyBikeInStation,
  } = useBikeActions({
    hasToken: true,
    status: statusFilter !== "all" ? (statusFilter as BikeStatus) : undefined,
    pageSize: pageSize,
    page: page,
  });

  // Fetch dữ liệu khi page hoặc filter thay đổi
  useEffect(() => {
    getMyBikeInStation();
  }, [getMyBikeInStation, page, statusFilter]);

  // Xử lý hiệu ứng loading mượt mà
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isLoadingMyBikeInStation) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingMyBikeInStation]);

  if (isVisualLoading) {
    return <LoadingScreen />;
  }

  return (
    <BikeClient
      data={{
        bikes: myBikeInStation?.data || [],
        pagination: myBikeInStation?.pagination,
        isVisualLoading,
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
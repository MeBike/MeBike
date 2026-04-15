"use client";

import { useState, useEffect } from "react";
import BikeClient from "./BikeClient";
import { useBikeActions } from "@/hooks/use-bike";
import { useStationActions } from "@/hooks/use-station";
import { useSupplierActions } from "@/hooks/use-supplier";
import { BikeStatus } from "@custom-types";

export default function Page() {
  // 1. QUẢN LÝ STATE
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<BikeStatus | "all">("all");
  const pageSize = 7;

  // 2. GỌI API TRẠM & NHÀ CUNG CẤP
  const { stations } = useStationActions({ hasToken: true });
  const { allSupplier } = useSupplierActions({ hasToken: true });

  // 3. GỌI API XE ĐẠP
  const {
    data,
    statusCount,
    isLoadingStatusCount,
    paginationBikes,
    getStatisticsBike,
    isLoadingBikes,
  } = useBikeActions({
    hasToken: true,
    status: statusFilter !== "all" ? (statusFilter as BikeStatus) : undefined,
    pageSize: pageSize,
    page: page,
  });

  // 4. EFFECTS
  useEffect(() => {
    getStatisticsBike();
  }, [getStatisticsBike]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  // 5. XỬ LÝ LOADING MƯỢT MÀ CHO BẢNG
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isLoadingBikes) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingBikes]);

  // 6. TRUYỀN DATA XUỐNG UI CLIENT
  return (
    <BikeClient
      data={{
        bikes: data?.data || [],
        statusCount,
        paginationBikes,
        stations: stations || [],
        suppliers: allSupplier?.data || [],
        isVisualLoading,
        isLoadingStatusCount,
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
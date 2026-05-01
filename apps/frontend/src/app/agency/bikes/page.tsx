"use client";

import { useState, useEffect } from "react";
import BikeClient from "./BikeClient"; // Path tới file hiển thị của bạn
import { useBikeActions } from "@/hooks/use-bike";
import { useStationActions } from "@/hooks/use-station";
import { useSupplierActions } from "@/hooks/use-supplier";
import { BikeStatus } from "@custom-types";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { useAgencyActions } from "@/hooks/use-agency";

export default function Page() {
  // 1. QUẢN LÝ STATE FILTER
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<BikeStatus | "all">("all");
  const [stationId, setStationId] = useState<string>("");
  const [supplierId, setSupplierId] = useState<string>("");
  const pageSize = 7;

  // 2. GỌI HOOKS HỖ TRỢ LẤY DATA CHO SELECT
  const { stations, getAllStations } = useStationActions({ hasToken: true });
  const {
    myAgencyBikeInStation,
    getMyAgencyBikeInStation,
    isLoadingMyAgencyBikeInStation,
  } = useAgencyActions({
    hasToken: true,
    status: statusFilter !== "all" ? (statusFilter as BikeStatus) : undefined,
    pageSize: pageSize,
    page: page,
    stationId: (!stationId || stationId === "all-stations") ? undefined : stationId,
    supplierId: (!supplierId || supplierId === "all-suppliers") ? undefined : supplierId,
  });

  // 4. EFFECTS GỌI DATA
  useEffect(() => {
    getAllStations();
  }, [getAllStations]);

  useEffect(() => {
    getMyAgencyBikeInStation();
  }, [getMyAgencyBikeInStation, page, statusFilter, stationId, supplierId]);

  // Reset về trang 1 khi thay đổi filter
  useEffect(() => {
    setPage(1);
  }, [statusFilter, stationId, supplierId]);

  // 5. XỬ LÝ LOADING
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isLoadingMyAgencyBikeInStation) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => setIsVisualLoading(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingMyAgencyBikeInStation]);

  if (isVisualLoading) return <LoadingScreen />;

  return (
    <BikeClient
      data={{
        bikes: myAgencyBikeInStation?.data || [],
        pagination: myAgencyBikeInStation?.pagination,
        stations: stations || [],
        isVisualLoading,
      }}
      filters={{
        statusFilter,
        page,
        stationId,
        supplierId,
      }}
      actions={{
        setStatusFilter,
        setPage,
        setStationId,
        setSupplierId,
        handleReset: () => {
          setStatusFilter("all");
          setStationId("");
          setSupplierId("");
          setPage(1);
        },
      }}
    />
  );
}
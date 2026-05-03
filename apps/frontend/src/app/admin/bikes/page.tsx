"use client";

import { useState, useEffect } from "react";
import BikeClient from "./BikeClient";
import { useBikeActions } from "@/hooks/use-bike";
import { useStationActions } from "@/hooks/use-station";
import { useSupplierActions } from "@/hooks/use-supplier";
import { BikeStatus } from "@custom-types";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { useDebounce } from "@/utils/useDebounce";
export default function Page() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<BikeStatus | "all">("all");
  const [supplierId , setSupplierId] = useState<string>("");
  const [stationId , setStationId] = useState<string>("");
  const pageSize = 7;
  const { stations , getAllStations} = useStationActions({ hasToken: true });
  const { allSupplier , getAllSuppliers } = useSupplierActions({ hasToken: true });
  const debouncedStatusFilter = useDebounce(statusFilter,500);
  const debouncedSupplierId = useDebounce(supplierId,500);
  const debouncedStationId = useDebounce(stationId,500);
  const {
    data,
    statusCount,
    isLoadingStatusCount,
    paginationBikes,
    getStatisticsBike,
    isLoadingBikes,
  } = useBikeActions({
    hasToken: true,
    status: debouncedStatusFilter !== "all" ? (debouncedStatusFilter as BikeStatus) : undefined,
    pageSize: pageSize,
    page: page,
    stationId: (!debouncedStationId || stationId === "all-stations") ? undefined : stationId,
    supplierId: (!debouncedSupplierId || supplierId === "all-suppliers") ? undefined : supplierId,
  });
  useEffect(() => {
    getStatisticsBike();
    getAllSuppliers();
    getAllStations();
  }, [getStatisticsBike,getAllSuppliers]);
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);
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
  if (isVisualLoading) {
    return <LoadingScreen />;
  }
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
        stationId,
        supplierId,
      }}
      actions={{
        setStatusFilter,
        setPage,
        setStationId,
        setSupplierId,
      }}
    />
  );
}

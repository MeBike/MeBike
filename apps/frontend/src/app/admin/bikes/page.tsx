"use client";

import { useState, useEffect } from "react";
import BikeClient from "./BikeClient";
import { useBikeActions } from "@/hooks/use-bike";
import { useStationActions } from "@/hooks/use-station";
import { useSupplierActions } from "@/hooks/use-supplier";
import { BikeStatus } from "@custom-types";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
export default function Page() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<BikeStatus | "all">("all");
  const [supplierId , setSupplierId] = useState<string>("");
  const [stationId , setStationId] = useState<string>("");
  const pageSize = 7;
  const { stations , getAllStations} = useStationActions({ hasToken: true });
  const { allSupplier , getAllSuppliers } = useSupplierActions({ hasToken: true });
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
    stationId: (!stationId || stationId === "all-stations") ? undefined : stationId,
    supplierId: (!supplierId || supplierId === "all-suppliers") ? undefined : supplierId,
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
  if (!data) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <p className="text-muted-foreground">
          Không tìm thấy thông tin các xe đạp.
        </p>
      </div>
    );
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

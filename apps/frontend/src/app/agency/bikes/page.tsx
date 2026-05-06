"use client";

import { useState, useEffect } from "react";
import BikeClient from "./BikeClient"; // Path tới file hiển thị của bạn
import { useBikeActions } from "@/hooks/use-bike";
import { useStationActions } from "@/hooks/use-station";
import { useSupplierActions } from "@/hooks/use-supplier";
import { BikeStatus } from "@custom-types";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { useAgencyActions } from "@/hooks/use-agency";
import { useDebounce } from "@/utils/useDebounce";

export default function Page() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<BikeStatus | "all">("all");
  const [stationId, setStationId] = useState<string>("");
  const [supplierId, setSupplierId] = useState<string>("");
  const [bikeId, setBikeId] = useState<string>("");
  const pageSize = 7;
  const debouncedStatusFilter = useDebounce(statusFilter, 500);
  const debouncedStationId = useDebounce(stationId, 500);
  const debouncedSupplierId = useDebounce(supplierId, 500);
  const debouncedBikeId = useDebounce(bikeId, 500);
  const { stations, getAllStations } = useStationActions({ hasToken: true });
  const {
    myAgencyBikeInStation,
    getMyAgencyBikeInStation,
    isLoadingMyAgencyBikeInStation,
  } = useAgencyActions({
    hasToken: true,
    status:
      debouncedStatusFilter !== "all"
        ? (debouncedStatusFilter as BikeStatus)
        : undefined,
    pageSize: pageSize,
    page: page,
    stationId:
      !debouncedStationId || debouncedStationId === "all-stations"
        ? undefined
        : debouncedStationId,
    supplierId:
      !debouncedSupplierId || debouncedSupplierId === "all-suppliers"
        ? undefined
        : debouncedSupplierId,
    bike_id: debouncedBikeId || undefined,
  });
  useEffect(() => {
    getAllStations();
  }, [getAllStations]);

  useEffect(() => {
    getMyAgencyBikeInStation();
  }, [
    getMyAgencyBikeInStation,
    page,
    debouncedStatusFilter,
    debouncedStationId,
    debouncedSupplierId,
    debouncedBikeId,
  ]);

  useEffect(() => {
    setPage(1);
  }, [debouncedStatusFilter, debouncedStationId, debouncedSupplierId]);
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
        paginationBikes: myAgencyBikeInStation?.pagination,
        isVisualLoading,
      }}
      filters={{
        statusFilter,
        page,
        bikeId,
      }}
      actions={{
        setStatusFilter,
        setPage,
        setBikeId,
      }}
    />
  );
}

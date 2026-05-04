"use client";

import { useState, useEffect } from "react";
import BikeClient from "./BikeClient";
import { useBikeActions } from "@/hooks/use-bike";
import { useStationActions } from "@/hooks/use-station";
import { BikeStatus } from "@custom-types";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { useDebounce } from "@/utils/useDebounce";
export default function Page() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<BikeStatus | "all">("all");
  const [stationId, setStationId] = useState<string>("");
  const pageSize = 7;
  const { stations, getAllStations } = useStationActions({ hasToken: true });
  const debouncedStatusFilter = useDebounce(statusFilter, 500);
  const debouncedStationId = useDebounce(stationId, 500);
  const { myBikeInStation, getMyBikeInStation, isLoadingMyBikeInStation } =
    useBikeActions({
      hasToken: true,
      status:
        debouncedStatusFilter !== "all"
          ? (debouncedStatusFilter as BikeStatus)
          : undefined,
      pageSize: pageSize,
      page: page,
      stationId:
        !debouncedStationId || stationId === "all-stations"
          ? undefined
          : stationId,
    });
  useEffect(() => {
    getMyBikeInStation();
    getAllStations();
  }, [page, debouncedStatusFilter, debouncedStationId]);
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);
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
        paginationBikes: myBikeInStation?.pagination,
        stations: stations || [],
        isVisualLoading,
      }}
      filters={{
        statusFilter,
        page,
        stationId,
      }}
      actions={{
        setStatusFilter,
        setPage,
        setStationId,
      }}
    />
  );
}

"use client";

import { useState, useEffect } from "react";
import RentalClient from "./RentalClient";
import { useRentalsActions } from "@/hooks/use-rental";
import { useStationActions } from "@/hooks/use-station";
import type { RentalStatus } from "@custom-types";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { useDebounce } from "@/utils/useDebounce";

export default function Page() {
  // 1. QUẢN LÝ STATE
  const [page, setPage] = useState<number>(1);
  const limit = 7;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RentalStatus | "">("");
  const [userId, setUserId] = useState<string>("");
  const [bikeId, setBikeId] = useState<string>("");
  const debouncedUserId = useDebounce(userId, 500);
  const debouncedBikeId = useDebounce(bikeId, 500);
  const [startStation, setStartStation] = useState<string>("");
  const [endStation, setEndStation] = useState<string>("");
  const { getAllStations, stations } = useStationActions({
    hasToken: true,
  });
  const {
    allRentalsData,
    pagination,
    getTodayRevenue,
    summaryRental,
    getRentals,
    getSummaryRental,
    isAllRentalsLoading,
  } = useRentalsActions({
    hasToken: true,
    limit: limit,
    page: page,
    ...(statusFilter !== "" && { status: statusFilter as RentalStatus }),
    ...(debouncedUserId !== "" && { userId: debouncedUserId }),
    ...(debouncedBikeId !== "" && { bikeId: debouncedBikeId }),
    ...(startStation !== "" && { startStation: startStation }),
    ...(endStation !== "" && { endStation: endStation }),
  });

  useEffect(() => {
    getTodayRevenue();
  }, [getTodayRevenue]);

  useEffect(() => {
    getRentals();
  }, [
    getRentals,
    page,
    statusFilter,
    startStation,
    endStation,
    debouncedUserId,
    debouncedBikeId,
  ]);

  useEffect(() => {
    getSummaryRental();
  }, [getSummaryRental]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    getAllStations();
  }, [getAllStations]);
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(true);
  useEffect(() => {
    if (isAllRentalsLoading) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isAllRentalsLoading]);

  if (isVisualLoading) {
    return <LoadingScreen />;
  }
  if (!allRentalsData) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <p className="text-muted-foreground">
          Không tìm thấy thông tin các phiên thuê.
        </p>
      </div>
    );
  }
  return (
    <RentalClient
      data={{
        rentals: allRentalsData || [],
        summaryRental,
        pagination,
        isVisualLoading,
        stations,
      }}
      filters={{
        searchQuery,
        statusFilter,
        userId : userId,
        bikeId : bikeId,
        startStation : startStation,
        endStation : endStation,
      }}
      actions={{
        setSearchQuery,
        setStatusFilter,
        setPage,
        setUserId, // Thêm
        setBikeId, // Thêm
        setStartStation, // Thêm
        setEndStation, // Thêm
        handleReset: () => {
          setSearchQuery("");
          setStatusFilter("");
          setUserId("");
          setBikeId("");
          setStartStation("");
          setEndStation("");
          setPage(1);
        },
      }}
    />
  );
}

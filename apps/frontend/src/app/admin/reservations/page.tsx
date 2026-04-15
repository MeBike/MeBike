"use client";

import { useEffect, useState } from "react";
import ReservationClient from "./ReservationClient";
import { useReservationActions } from "@/hooks/use-reservation";
import { useStationActions } from "@/hooks/use-station";
import type { ReservationStatus, ReservationOption } from "@/types/Reservation";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
export default function Page() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "">("");
  const [option, setReservationOption] = useState<ReservationOption | "">("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;
  const [selectedReservationId, setSelectedReservationId] =
    useState<string>("");
  const { stations, getAllStations } = useStationActions({ hasToken: true });
  const {
    allReservations,
    fetchAllReservations,
    reservationStats,
    fetchReservationStats,
    detailReservation,
    fetchDetailReservation,
    isLoadingReservations,
  } = useReservationActions({
    hasToken: true,
    page: currentPage,
    pageSize: pageSize,
    id: selectedReservationId,
    status: statusFilter as ReservationStatus,
    option: option as ReservationOption,
  });

  // 4. EFFECTS GỌI DATA
  useEffect(() => {
    fetchAllReservations();
    fetchReservationStats();
    getAllStations();
  }, [
    fetchAllReservations,
    fetchReservationStats,
    getAllStations,
    currentPage,
    statusFilter,
    option,
  ]);

  useEffect(() => {
    if (selectedReservationId) {
      fetchDetailReservation();
    }
  }, [selectedReservationId, fetchDetailReservation]);

  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("");
    setReservationOption("");
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isLoadingReservations) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingReservations]);
  if (isVisualLoading) {
    return <LoadingScreen />;
  }
  if (!allReservations) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <p className="text-muted-foreground">
          Không tìm thấy thông tin các đơn đặt trước.
        </p>
      </div>
    );
  }
  return (
    <ReservationClient
      data={{
        allReservations,
        reservationStats,
        stations,
        isVisualLoading,
      }}
      filters={{
        searchQuery,
        statusFilter,
        currentPage,
      }}
      actions={{
        setSearchQuery,
        setStatusFilter,
        setCurrentPage,
        setSelectedReservationId,
        handleReset,
        handleFilterChange,
      }}
    />
  );
}

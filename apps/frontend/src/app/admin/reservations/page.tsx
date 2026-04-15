"use client";

import { useEffect, useState } from "react";
import ReservationClient from "./ReservationClient";
import { useReservationActions } from "@/hooks/use-reservation";
import { useStationActions } from "@/hooks/use-station";
import type { ReservationStatus, ReservationOption } from "@/types/Reservation";

export default function Page() {
  // 1. QUẢN LÝ STATE
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "">("");
  const [option, setReservationOption] = useState<ReservationOption | "">("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;
  const [selectedReservationId, setSelectedReservationId] = useState<string>("");

  // 2. GỌI API TRẠM (STATIONS)
  const { stations, getAllStations } = useStationActions({ hasToken: true });

  // 3. GỌI API ĐẶT TRƯỚC (RESERVATIONS)
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

  // Effect lấy chi tiết khi có ID (Mặc dù phần Modal đang comment out, vẫn giữ lại logic cho an toàn)
  useEffect(() => {
    if (selectedReservationId) {
      fetchDetailReservation();
    }
  }, [selectedReservationId, fetchDetailReservation]);

  // 5. XỬ LÝ LOADING MƯỢT
  const [isVisualLoading, setIsVisualLoading] = useState(true);

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

  // 6. CÁC HÀM XỬ LÝ SỰ KIỆN LỌC
  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("");
    setReservationOption("");
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // 7. TRUYỀN DATA XUỐNG CLIENT UI
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
"use client";

import { useEffect, useState, useCallback } from "react";
import ReservationClient from "./ReservationClient";
import { useReservationActions } from "@/hooks/use-reservation";
import { useStationActions } from "@/hooks/use-station";
import type { ReservationStatus, ReservationOption } from "@/types/Reservation";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";

export default function Page() {
  const { stations, getAllStations } = useStationActions({ hasToken: true });
  
  // 1. QUẢN LÝ STATE FILTER
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "">("");
  const [option, setReservationOption] = useState<ReservationOption | "">("");
  const [userId, setUserId] = useState<string>("");
  const [bikeId, setBikeId] = useState<string>("");
  const [selectedReservationId, setSelectedReservationId] = useState<string>("");

  const {
    allReservationsStaff,
    fetchAllReservationsForStaff,
    isLoadingReservationsStaff,
  } = useReservationActions({
    hasToken: true,
    page: currentPage,
    pageSize: pageSize,
    status: statusFilter as ReservationStatus,
    option: option as ReservationOption,
    userId: userId,
    bikeId: bikeId,
  });

  // 2. FETCH DATA
  useEffect(() => {
    fetchAllReservationsForStaff();
    getAllStations();
  }, [
    fetchAllReservationsForStaff, 
    getAllStations, 
    currentPage, 
    statusFilter, 
    option, 
    userId, 
    bikeId
  ]);

  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("");
    setReservationOption("");
    setUserId("");
    setBikeId("");
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // 3. LOADING TRẠNG THÁI
  const [isVisualLoading, setIsVisualLoading] = useState(false);
  useEffect(() => {
    if (isLoadingReservationsStaff) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => setIsVisualLoading(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingReservationsStaff]);

  if (isVisualLoading) return <LoadingScreen />;

  return (
    <ReservationClient
      data={{
        allReservationsStaff,
        stations,
        isVisualLoading,
      }}
      filters={{
        searchQuery,
        statusFilter,
        option,
        userId,
        bikeId,
        currentPage,
      }}
      actions={{
        setSearchQuery,
        setStatusFilter,
        setReservationOption,
        setUserId,
        setBikeId,
        setCurrentPage,
        setSelectedReservationId,
        handleReset,
        handleFilterChange,
      }}
    />
  );
}
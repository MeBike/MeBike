"use client";

import { useEffect, useState, useCallback } from "react";
import ReservationClient from "./ReservationClient";
import { useReservationActions } from "@/hooks/use-reservation";
import { useStationActions } from "@/hooks/use-station";
import type { ReservationStatus, ReservationOption } from "@/types/Reservation";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { useDebounce } from "@/utils/useDebounce";
export default function Page() {
  const { stations, getAllStations } = useStationActions({ hasToken: true });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "">("");
  const [option, setReservationOption] = useState<ReservationOption | "">("");
  const [userId, setUserId] = useState<string>("");
  const [bikeId, setBikeId] = useState<string>("");
  const [selectedReservationId, setSelectedReservationId] = useState<string>("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const debouncedUserId = useDebounce(userId, 500);
  const debouncedBikeId = useDebounce(bikeId, 500);
  const debouncedStatusFilter = useDebounce(statusFilter as ReservationStatus, 500);
  const debouncedOption = useDebounce(option as ReservationOption, 500);
  const {
    allReservationsStaff,
    fetchAllReservationsForStaff,
    isLoadingReservationsStaff,
  } = useReservationActions({
    hasToken: true,
    page: currentPage,
    pageSize: pageSize,
    status: debouncedStatusFilter as ReservationStatus || "",
    option: debouncedOption as ReservationOption || "",
    userId: debouncedUserId || undefined,
    bikeId: debouncedBikeId || undefined,
  });

  useEffect(() => {
    fetchAllReservationsForStaff();
    getAllStations();
  }, [
    fetchAllReservationsForStaff, 
    getAllStations, 
    currentPage, 
    debouncedStatusFilter, 
    debouncedOption, 
    debouncedUserId, 
    debouncedBikeId
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
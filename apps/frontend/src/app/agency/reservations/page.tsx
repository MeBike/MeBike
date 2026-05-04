"use client";

import { useEffect, useState } from "react";
import ReservationClient from "./ReservationClient"; // Path tới file client của bạn
import { useStationActions } from "@/hooks/use-station";
import { useAgencyActions } from "@/hooks/use-agency";
import type { ReservationOption, ReservationStatus } from "@/types/Reservation";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { useDebounce } from "@/utils/useDebounce";
export default function Page() {
  const { stations } = useStationActions({ hasToken: true });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "">("");
  const [option, setReservationOption] = useState<ReservationOption | "">("");
  const [userId, setUserId] = useState<string>("");
  const [bikeId, setBikeId] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedStatusFilter = useDebounce(statusFilter, 300);
  const debouncedOption = useDebounce(option, 300);
  const debouncedUserId = useDebounce(userId, 300);
  const debouncedBikeId = useDebounce(bikeId, 300);
  const {
    allReservationsAgency,
    getReservationsForAgency,
    isLoadingReservationsAgency,
  } = useAgencyActions({
    hasToken: true,
    page: currentPage,
    pageSize: pageSize,
    renservation_status: (debouncedStatusFilter as ReservationStatus) || "",
    option: (debouncedOption as ReservationOption) || "",
    userId: debouncedUserId || "",
    bikeId: debouncedBikeId || "",
  });

  const [isVisualLoading, setIsVisualLoading] = useState(false);

  useEffect(() => {
    if (isLoadingReservationsAgency) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => setIsVisualLoading(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingReservationsAgency]);

  useEffect(() => {
    getReservationsForAgency();
  }, [getReservationsForAgency, currentPage, debouncedStatusFilter, debouncedOption, debouncedUserId, debouncedBikeId]);

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

  if (isVisualLoading) return <LoadingScreen />;

  return (
    <ReservationClient
      data={{
        allReservationsAgency,
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
        handleReset,
        handleFilterChange,
      }}
    />
  );
}

"use client";

import { useEffect, useState } from "react";
import StationClient from "./StationClient";
import { useStationActions } from "@/hooks/use-station";

export default function Page() {
  // 1. QUẢN LÝ STATE
  const [page, setPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRevenueReport, setShowRevenueReport] = useState(false);
  const limit = 7;

  // 2. GỌI API
  const {
    getAllStations,
    stations,
    paginationStations,
    deleteStation,
    getStationRevenue,
    responseStationRevenue,
    isLoadingGetAllStations,
  } = useStationActions({
    hasToken: true,
    page: page,
    limit: limit,
    name: searchQuery,
  });

  // 3. EFFECTS
  useEffect(() => {
    getAllStations();
  }, [page, limit, searchQuery, getAllStations]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  // 4. XỬ LÝ LOADING MƯỢT MÀ
  const [isVisualLoading, setIsVisualLoading] = useState(true);

  useEffect(() => {
    if (isLoadingGetAllStations) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingGetAllStations]);

  // 5. CÁC HÀM XỬ LÝ SỰ KIỆN
  const handleToggleRevenueReport = () => {
    if (!showRevenueReport) {
      getStationRevenue();
    }
    setShowRevenueReport(!showRevenueReport);
  };

  const handleResetSearch = () => {
    setSearchQuery("");
  };

  // 6. TRUYỀN DATA XUỐNG UI
  return (
    <StationClient
      data={{
        stations,
        paginationStations,
        responseStationRevenue,
        showRevenueReport,
        isVisualLoading,
        isLoadingGetAllStations,
      }}
      filters={{
        searchQuery,
      }}
      actions={{
        setSearchQuery,
        setPage,
        handleToggleRevenueReport,
        handleResetSearch,
        deleteStation,
      }}
    />
  );
}
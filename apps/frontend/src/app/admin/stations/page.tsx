"use client";

import { useEffect, useState } from "react";
import StationClient from "./StationClient";
import { useStationActions } from "@/hooks/use-station";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
export default function Page() {
  const [page, setPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRevenueReport, setShowRevenueReport] = useState(false);
  const limit = 7;
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
  useEffect(() => {
    getAllStations();
  }, [page, limit, searchQuery, getAllStations]);
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(true);
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
  if (isVisualLoading) {
    return <LoadingScreen />;
  }
  const handleToggleRevenueReport = () => {
    if (!showRevenueReport) {
      getStationRevenue();
    }
    setShowRevenueReport(!showRevenueReport);
  };
  const handleResetSearch = () => {
    setSearchQuery("");
  };
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

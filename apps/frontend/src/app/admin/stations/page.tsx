"use client";

import { useEffect, useState } from "react";
import StationClient from "./StationClient";
import { useDebounce } from "@/utils/useDebounce";
import { useStationActions } from "@/hooks/use-station";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { useSystemConfigActions } from "@/hooks/use-system-config";
export default function Page() {
  const [page, setPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRevenueReport, setShowRevenueReport] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const limit = 7;
  const { systemConfigs , getAllSystemConfigs , refetch } = useSystemConfigActions({hasToken:true});
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
    name: debouncedSearchQuery,
  });
  useEffect(() => {
    getAllStations();
    getAllSystemConfigs();
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
        distributionConfig : systemConfigs?.find((config) => config.key === "min_available_bikes_at_station")?.value || "",
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

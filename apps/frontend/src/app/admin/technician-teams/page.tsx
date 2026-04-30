"use client";

import { useState, useEffect } from "react";
import Client from "./client";
import { TechnicianStatus } from "@custom-types";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { useTechnicianTeamActions } from "@/hooks/use-tech-team";
import { useStationActions } from "@/hooks/use-station";

export default function Page() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<TechnicianStatus | "">("");
  const [stationId, setStationId] = useState("all-stations");
  const pageSize = 7;

  const { allTechnicianTeam, getTechnicianTeam, isLoadingAllTechnicianTeam } =
    useTechnicianTeamActions({
      hasToken: true,
      page: page,
      pageSize: pageSize,
      status: statusFilter,
      station_id: stationId === "all-stations" ? "" : stationId,
    });

  const { getAllStations, stations } = useStationActions({ hasToken: true });

  useEffect(() => {
    getTechnicianTeam();
    getAllStations();
  }, [page, statusFilter, stationId, getTechnicianTeam, getAllStations]);

  // Reset về trang 1 khi thay đổi bộ lọc
  useEffect(() => {
    setPage(1);
  }, [statusFilter, stationId]);

  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isLoadingAllTechnicianTeam) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => setIsVisualLoading(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingAllTechnicianTeam]);

  if (isVisualLoading && !allTechnicianTeam) {
    return <LoadingScreen />;
  }

  return (
    <div className="w-full p-6">
      <Client
        data={{
          technicianTeam: allTechnicianTeam?.data || [],
          pagination: allTechnicianTeam?.pagination,
          stations: stations || [],
          isVisualLoading: isVisualLoading,
        }}
        filters={{
          statusFilter,
          stationId,
          page,
        }}
        actions={{
          setStatusFilter,
          setStationId,
          setPage,
        }}
      /> 
    </div>
  );
}
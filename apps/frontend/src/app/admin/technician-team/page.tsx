"use client";

import { useState, useEffect } from "react";
import Client from "./client";
import { TechnicianStatus } from "@custom-types";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { useTechnicianTeamActions } from "@/hooks/use-tech-team";
export default function Page() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<TechnicianStatus | "">("");
  const pageSize = 7;
  const {allTechnicianTeam,getTechnicianTeam,isLoadingAllTechnicianTeam} = useTechnicianTeamActions({hasToken:true,page:page,pageSize:pageSize})
  useEffect(() => {
    getTechnicianTeam();
  }, [getTechnicianTeam]);
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isLoadingAllTechnicianTeam) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingAllTechnicianTeam]);
  if (isVisualLoading) {
    return <LoadingScreen />;
  }
  if (!allTechnicianTeam) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <p className="text-muted-foreground">
          Không tìm thấy thông tin các xe đạp.
        </p>
      </div>
    );
  }
  return (
    <Client
      data={{
        technicianTeam : allTechnicianTeam.data,
        paginationBikes : allTechnicianTeam.pagination,
        isVisualLoading : isVisualLoading,
        isLoadingStatusCount : isLoadingAllTechnicianTeam,
      }}
      filters={{
        statusFilter,
        page,
      }}
      actions={{
        setStatusFilter,
        setPage,
      }}
    />
  );
}

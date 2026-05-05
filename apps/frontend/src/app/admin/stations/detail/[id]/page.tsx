"use client";

import React, { useEffect, useState } from "react";
import StationDetailClient from "./Client";
import { useStationActions } from "@/hooks/use-station";
import type { Station } from "@/types";
import { StationSchemaFormData } from "@/schemas/station-schema";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(false);
  const {
    getStationByID,
    responseStationDetail,
    isLoadingGetStationByID,
    updateStation,
    getStationRevenue,
    responseStationRevenue,
  } = useStationActions({
    hasToken: true,
    stationId: id,
  });

  useEffect(() => {
    if (id) {
      getStationByID();
      getStationRevenue();
    }
  }, [id, getStationByID, getStationRevenue]);

  useEffect(() => {
    if (isLoadingGetStationByID) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoadingGetStationByID]);
  
  if (!responseStationDetail) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <p className="text-muted-foreground">Không tìm thấy thông tin trạm.</p>
      </div>
    );
  }


  const handleUpdate = async (data: StationSchemaFormData) => {
    try {
      await updateStation(data);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Trích xuất doanh thu của trạm hiện tại
  const rawRevenueData = (responseStationRevenue as any)?.data || responseStationRevenue;
  const currentStationRevenue = rawRevenueData?.stations?.find((s: any) => s.id === id);

  return (
    <StationDetailClient
      id={id}
      station={responseStationDetail as Station}
      isLoading={isLoadingGetStationByID}
      onUpdateStation={handleUpdate}
      revenueData={currentStationRevenue} // <-- Truyền prop doanh thu xuống Client
    />
  );
}
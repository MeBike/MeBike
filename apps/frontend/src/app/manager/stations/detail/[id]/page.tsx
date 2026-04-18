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
  } = useStationActions({
    hasToken: true,
    stationId: id,
  });

  useEffect(() => {
    if (id) {
      getStationByID();
    }
  }, [id, getStationByID]);
  useEffect(() => {
    if (isLoadingGetStationByID) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
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
  if (isVisualLoading) {
    return <LoadingScreen />;
  }
  const handleUpdate = async (data: StationSchemaFormData) => {
    try {
      await updateStation(data);
      return true;
    } catch (error) {
      return false;
    }
  };
  return (
    <StationDetailClient
      id={id}
      station={responseStationDetail as Station}
      isLoading={isLoadingGetStationByID}
      onUpdateStation={handleUpdate}
    />
  );
}

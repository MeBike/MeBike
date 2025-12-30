"use client";
import StationDetail from "../../components/StationDetail";
import React from "react";
import { notFound } from "next/navigation";
import { useStationActions } from "@/hooks/use-station";
import { Loader2 } from "lucide-react";
export default function Page({
  params,
}: {
  params: Promise<{ stationId: string }>;
}) {
  const { stationId } = React.use(params);
  const { isLoadingGetStationByID, responseStationDetail , updateStation} =
    useStationActions({ hasToken: true, stationId: stationId });
  if (isLoadingGetStationByID) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
        <Loader2 className="animate-spin w-16 h-16 text-primary" />
      </div>
    );
  }
  if (!responseStationDetail) {
    notFound();
  }
  return (
    <StationDetail station={responseStationDetail} onSubmit={updateStation} />
  );
}

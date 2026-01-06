"use client";
import StationDetail from "../../components/StationDetail";
import React from "react";
import { notFound } from "next/navigation";
import { useStationActions } from "@/hooks/use-station";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";
export default function StationDetailClient({
  params,
}: {
  params: Promise<{ stationId: string }>;
}) {
  const { stationId } = React.use(params);
  const { isLoadingGetStationByID, responseStationDetail, updateStation } =
    useStationActions({ hasToken: true, stationId: stationId });
  if (isLoadingGetStationByID) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
        <Loader2 className="animate-spin w-16 h-16 text-primary" />
      </div>
    );
  }
  if (!responseStationDetail?.data) {
    notFound();
  }
  return (
    <Suspense
      fallback={<Loader2 className="animate-spin w-16 h-16 text-primary" />}
    >
      <StationDetail station={responseStationDetail.data} onSubmit={updateStation} />
    </Suspense>
  );
}

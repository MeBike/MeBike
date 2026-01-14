"use client";
import StationDetail from "../../components/StationDetail";
import React from "react";
import { notFound } from "next/navigation";
import { useStationActions } from "@/hooks/use-station";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import Loading from "./loading";
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
      <Loading/>
    );
  }
  if (!responseStationDetail?.data) {
    notFound();
  }
  return (
    <Suspense
      fallback={<Loading />}
    >
      <StationDetail station={responseStationDetail.data} onSubmit={updateStation} />
    </Suspense>
  );
}

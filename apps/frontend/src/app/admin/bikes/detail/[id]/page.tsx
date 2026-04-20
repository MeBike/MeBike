"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBikeActions } from "@/hooks/use-bike";
import { BikeDetailView } from "./BikeDetail";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
export default function BikeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(false);
  const {
    detailBike,
    getBikeByID,
    getBikeActivityStats,
    isLoadingDetail,
    bikeActivityStats,
    bikeHistory,
    getHistoryBike,
    statisticsBike,
    getStatsBike,
    isLoadingStatisticsBike,
    getStatisticsBike,
    bikeStats,
    getBikeStats,
  } = useBikeActions({ hasToken: true, bike_detail_id: id });

  useEffect(() => {
    getBikeByID();
    getBikeActivityStats();
    getHistoryBike();
    getStatisticsBike();
    getBikeStats();
  }, [id]);
  useEffect(() => {
    if (isLoadingDetail && isLoadingStatisticsBike) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingDetail, isLoadingStatisticsBike]);
  if (!detailBike) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <p className="text-muted-foreground">
          Không tìm thấy thông tin xe đạp.
        </p>
      </div>
    );
  }
  if (isVisualLoading) {
    return <LoadingScreen />;
  }
  return (
    <div className="-m-6 min-h-[calc(100vh-5rem)] bg-slate-50 p-6 dark:bg-background">
      <div className="mx-auto max-w-6xl space-y-6">
        <BikeDetailView
          bike={detailBike || null}
          activity={bikeActivityStats || null}
          rentals={bikeHistory?.data.data || []}
          statisticData={statisticsBike || null}
        />
      </div>
    </div>
  );
}

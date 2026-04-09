"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useBikeActions } from "@/hooks/use-bike";
import { BikeDetailView } from "./BikeDetail"; 

export default function BikeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  
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
    getBikeStats()
  }, [id]);

  if (isLoadingDetail || isLoadingStatisticsBike) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="-m-6 min-h-[calc(100vh-5rem)] bg-slate-50 p-6 dark:bg-background">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Chi tiết xe: {detailBike?.chipId || "N/A"}
            </h1>
          </div>
          <Button variant="outline" onClick={() => router.push("/admin/bikes")}>
             Danh sách xe
          </Button>
        </div>

        {/* Content */}
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
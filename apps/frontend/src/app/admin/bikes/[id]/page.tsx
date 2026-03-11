"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useBikeActions } from "@/hooks/use-bike";
import { BikeDetailTabs } from "../components/bike-detail-tabs";

export default function BikeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { detailBike, getBikeByID, getBikeActivityStats, getRentalBikes, isLoadingDetail, bikeRentals, bikeActivityStats, bikeStats } = useBikeActions({ hasToken: true, bike_detail_id: id });

  useEffect(() => {
    getBikeByID();
    getBikeActivityStats();
    getRentalBikes();
  }, [id]);

  if (isLoadingDetail) return <Loader2 className="animate-spin m-auto" />;

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push("/admin/bikes")}><ChevronLeft className="w-4 h-4 mr-1" /> Quay lại</Button>
      <div className="bg-card border rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Chi tiết xe: {detailBike?.chipId}</h1>
        <BikeDetailTabs 
          bike={detailBike || null} 
          rentals={bikeRentals || []} 
          activity={bikeActivityStats} 
          stats={bikeStats} 
        />
      </div>
    </div>
  );
}
"use client"
import BikeDetailClient from "./BikeDetailClient";
import React from "react";
import { notFound } from "next/navigation";
import { useBikeActions } from "@/hooks/use-bike";
import { useStationActions } from "@/hooks/use-station";
import { useSupplierActions } from "@/hooks/use-supplier";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-providers";
export default function Page({ params }: { params: Promise<{ bikeId: string }> }) {
  const { bikeId } = React.use(params);
  console.log(bikeId);
  const { user } = useAuth();
  console.log(user);
  const { detailBike, isLoadingDetail } = useBikeActions(true, bikeId);
  const { stations, isLoadingGetAllStations } = useStationActions({
    hasToken: true,
  });
  const { allSupplier, isLoadingAllSupplier } = useSupplierActions({
    hasToken: true,
  });

  
  if (isLoadingDetail || isLoadingGetAllStations || isLoadingAllSupplier) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
        <Loader2 className="animate-spin w-16 h-16 text-primary" />
      </div>
    );
  }
  if(!detailBike){
    notFound();
  }

  return (
    <BikeDetailClient
      initialBike={detailBike || null}
      allSuppliers={allSupplier || []}
      allStations={stations || []}
    />
  );
}

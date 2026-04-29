"use client";

import React from "react";
import CreateBikeClient from "./Client";
import { useBikeActions } from "@/hooks/use-bike";
import { useStationActions } from "@/hooks/use-station";
import { useSupplierActions } from "@/hooks/use-supplier";
import { useEffect } from "react";
export default function Page() {
  const { createBike } = useBikeActions({ hasToken: true });
  const { stations , getAllStations } = useStationActions({ hasToken: true , page : 1 , limit : 1000 });
  const { allSupplier , getAllSuppliers } = useSupplierActions({ hasToken: true });
  useEffect(() => {
    getAllStations();
    getAllSuppliers();
  }, [getAllStations, getAllSuppliers]);
  
  return (
    <CreateBikeClient 
      onSubmitBike={createBike}
      stations={stations}
      suppliers={allSupplier?.data} // Chỉ lấy mảng data truyền xuống
    />
  );
}
"use client";

import React from "react";
import CreateBikeClient from "./Client";
import { useBikeActions } from "@/hooks/use-bike";
import { useStationActions } from "@/hooks/use-station";
import { useSupplierActions } from "@/hooks/use-supplier";

export default function Page() {
  const { createBike } = useBikeActions({ hasToken: true });
  const { stations } = useStationActions({ hasToken: true });
  const { allSupplier } = useSupplierActions({ hasToken: true });

  return (
    <CreateBikeClient 
      onSubmitBike={createBike}
      stations={stations}
      suppliers={allSupplier?.data} // Chỉ lấy mảng data truyền xuống
    />
  );
}
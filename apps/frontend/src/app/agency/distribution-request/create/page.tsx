"use client";

import { useDistributionRequest } from "@/hooks/use-distribution-request";
import { useStationActions } from "@/hooks/use-station";
import CreateDistributionRequestClient from "./client";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";// Giả sử bạn có component này
import { useEffect } from "react";
import { useSystemConfigActions } from "@/hooks/use-system-config";
export default function CreateDistributionRequestPage() {
  const { agencyCreateDistributeRequest } = useDistributionRequest({
    hasToken: true,
  });
  const { getListStation, listStation, isLoadingListStation } = useStationActions({
    hasToken: true,
  });
  const { systemConfigs, getAllSystemConfigs, isLoading } =
      useSystemConfigActions({ hasToken: true });
  useEffect(() => {
    getListStation();
    getAllSystemConfigs();
  }, [getListStation,getAllSystemConfigs]);
  if (isLoadingListStation || isLoading) {
    return <LoadingScreen />;
  }
  const minAvailableBikeAtStation = Number(
    systemConfigs?.find((item) => item.key === "min_available_bikes_at_station")
      ?.value || 0,
  );
  return (
    <div className="">
      <CreateDistributionRequestClient
        onSubmitRequest={agencyCreateDistributeRequest}
        stations={listStation || { currentStation: { id: "", name: "", address: "", operationalAvailableSlots: 0  }, otherStations: [] }}
        minAvailableBikeAtStation = {minAvailableBikeAtStation}
      />
    </div>
  );
}
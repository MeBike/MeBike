"use client";

import { useDistributionRequest } from "@/hooks/use-distribution-request";
import { useStationActions } from "@/hooks/use-station";
import CreateDistributionRequestClient from "@/app/staff/distribution-request/create/client";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";// Giả sử bạn có component này
import { useEffect } from "react";

export default function CreateDistributionRequestPage() {
  const { agencyCreateDistributeRequest } = useDistributionRequest({
    hasToken: true,
  });
  const { getListStation, listStation, isLoadingListStation } = useStationActions({
    hasToken: true,
  });
  useEffect(() => {
    getListStation();
  }, [getListStation]);
  if (isLoadingListStation) {
    return <LoadingScreen />;
  }
  return (
    <div className="container mx-auto py-8">
      <CreateDistributionRequestClient
        onSubmitRequest={agencyCreateDistributeRequest}
        stations={listStation || { currentStation: { id: "", name: "", address: "" }, otherStations: [] }}
      />
    </div>
  );
}
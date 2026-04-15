"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAgencyActions } from "@/hooks/use-agency";
import { AgencyStatsView } from "./AgencyStatClient";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
export default function AgencyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    agencyStats,
    getAgencyStat,
    isLoadingAgencyStats,
    updateAgency,
    updateAgencyStatus,
  } = useAgencyActions({ hasToken: true, agency_id: id });
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(false);
  useEffect(() => {
    if (isLoadingAgencyStats) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingAgencyStats]);
  useEffect(() => {
    getAgencyStat();
  }, [id, getAgencyStat]);
  if (isVisualLoading) {
    return <LoadingScreen />;
  }
  if (!agencyStats) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <p className="text-muted-foreground">
          Không tìm thấy thông tin agency.
        </p>
      </div>
    );
  }
  return (
    <>
      <AgencyStatsView
        key={agencyStats.agency.id}
        stats={agencyStats}
        onUpdateInfo={(data) => updateAgency(data, id)}
        onUpdateStatus={(data) => updateAgencyStatus(data, id)}
      />
    </>
  );
}

"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAgencyActions } from "@/hooks/use-agency";
import { AgencyStatsView } from "./AgencyStatClient";

export default function AgencyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  
  const { 
    agencyStats, 
    getAgencyStat, 
    isLoadingAgencyStats,
    updateAgency,
    updateAgencyStatus 
  } = useAgencyActions({ hasToken: true, agency_id: id });

  useEffect(() => {
    getAgencyStat();
  }, [id, getAgencyStat]);

  if (isLoadingAgencyStats) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="-m-6 min-h-[calc(100vh-5rem)] bg-slate-50 p-6 dark:bg-background">
      <div className="space-y-4">
        {/* Khôi phục cụm nút điều hướng của bạn */}
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
            <h1 className="text-lg font-semibold text-foreground">Chi tiết Agency</h1>
          </div>
          <Button variant="outline" onClick={() => router.push("/admin/agencies")}>
             Danh sách Agency
          </Button>
        </div>

        <div className="pt-3">
          {agencyStats && (
            <AgencyStatsView 
              key={agencyStats.agency.id} // Thêm key để React tái tạo component khi đổi Agency
              stats={agencyStats} 
              onUpdateInfo={(data) => updateAgency(data, id)}
              onUpdateStatus={(data) => updateAgencyStatus(data, id)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
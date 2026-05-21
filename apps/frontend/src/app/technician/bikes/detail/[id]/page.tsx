"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useBikeActions } from "@/hooks/use-bike";
import { BikeDetailView } from "./BikeDetail";
import { SimpleUpdateBikeDialog } from "../../components/simple-update";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { notFound } from "next/navigation";
export default function BikeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const {
    myBikeInStationDetail,
    getMyBikeInStationDetail,
    isLoadingMyBikeInStationDetail,
    technicianUpdateBikeStatus,
    isTechnicianUpdateStatusBike,
  } = useBikeActions({ hasToken: true, bike_detail_id: id });
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(true);
  useEffect(() => {
    if (isLoadingMyBikeInStationDetail) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingMyBikeInStationDetail]);
  useEffect(() => {
    getMyBikeInStationDetail();
  }, [id]);
  if (isVisualLoading) {
    return <LoadingScreen />;
  }
  if (!myBikeInStationDetail) {
    notFound();
  }
  const handleUpdateStatus = async (data: {
    status: "AVAILABLE" | "BROKEN" | "FIXED";
  }) => {
    await technicianUpdateBikeStatus(id, data.status);
    getMyBikeInStationDetail();
  };
  return (
    <div className="min-h-[calc(100vh-5rem)] w-full bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-background">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl line-clamp-1">
              Chi tiết xe
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {myBikeInStationDetail && (
              <SimpleUpdateBikeDialog
                bike={myBikeInStationDetail}
                onUpdate={handleUpdateStatus}
                isUpdating={isTechnicianUpdateStatusBike}
              />
            )}
            <Button
              variant="outline"
              onClick={() => router.push("/technician/bikes")}
            >
              Danh sách xe
            </Button>
          </div>
        </div>

        <BikeDetailView bike={myBikeInStationDetail || null} />
      </div>
    </div>
  );
}

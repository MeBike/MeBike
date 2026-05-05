"use client";

import { use, useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BikeDetailView } from "./BikeDetail";
import { useBikeActions } from "@/hooks/use-bike";
import { useAgencyActions } from "@/hooks/use-agency";
import { SimpleUpdateBikeDialog } from "../../components/simple-update";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const {
    myAgencyBikeInStationDetail,
    getMyAgencyBikeInStationDetail,
    isLoadingMyAgencyBikeInStationDetail,
    updateBikeStatus,
    isUpdatingStatus,
  } = useAgencyActions({ hasToken: true, bike_detail_id: id });
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(true);
  useEffect(() => {
    if (isLoadingMyAgencyBikeInStationDetail) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoadingMyAgencyBikeInStationDetail]);
  const handleUpdateStatus = async (data: {
    status: "AVAILABLE" | "BROKEN";
  }) => {
    // Truyền data.status vào hàm update
    await updateBikeStatus(id, data.status);
    getMyAgencyBikeInStationDetail();
  };
  useEffect(() => {
    getMyAgencyBikeInStationDetail();
  }, [id]);
  if (isVisualLoading) {
    return <LoadingScreen />;
  }
  if (!myAgencyBikeInStationDetail) {
    notFound();
  }
  return (
    <div className="-m-6 min-h-[calc(100vh-5rem)] bg-slate-50 p-6 dark:bg-background">
      <div className="mx-auto max-w-6xl space-y-6">
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
              Chi tiết xe
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {myAgencyBikeInStationDetail && (
              <SimpleUpdateBikeDialog
                bike={myAgencyBikeInStationDetail}
                onUpdate={handleUpdateStatus}
                isUpdating={isUpdatingStatus}
              />
            )}
            <Button
              variant="outline"
              onClick={() => router.push("/agency/bikes")}
            >
              Danh sách xe
            </Button>
          </div>
        </div>
        <BikeDetailView bike={myAgencyBikeInStationDetail || null} />
      </div>
    </div>
  );
}

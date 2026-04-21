"use client";
import { notFound } from "next/navigation";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useBikeActions } from "@/hooks/use-bike";
import { BikeDetailView } from "./BikeDetail";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { SimpleUpdateBikeDialog } from "../../components/simple-update";
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
    updateBikeStatus,
    isUpdateStatusBike,
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
    if (id) {
      getMyBikeInStationDetail();
    }
  }, [id, getMyBikeInStationDetail]);

  if (isVisualLoading) {
    return <LoadingScreen />;
  }
  if (!myBikeInStationDetail) {
    return notFound();
  }
  const handleUpdateStatus = async (data: {
    status: "AVAILABLE" | "BROKEN";
  }) => {
    // Truyền data.status vào hàm update
    await updateBikeStatus(id, data.status);
    getMyBikeInStationDetail();
  };
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
          </div>
          <div className="flex items-center gap-2">
            {/* Tích hợp Dialog vào đây */}
            {myBikeInStationDetail && (
              <SimpleUpdateBikeDialog
                bike={myBikeInStationDetail}
                onUpdate={handleUpdateStatus}
                isUpdating={isUpdateStatusBike}
              />
            )}
            <Button
              variant="outline"
              onClick={() => router.push("/manager/bikes")}
            >
              Danh sách xe
            </Button>
          </div>
        </div>

        {/* Content */}
        <BikeDetailView bike={myBikeInStationDetail || null} />
      </div>
    </div>
  );
}

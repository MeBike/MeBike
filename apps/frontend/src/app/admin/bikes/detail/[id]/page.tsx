"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBikeActions } from "@/hooks/use-bike";
import { BikeDetailView } from "./BikeDetail";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { useStationActions } from "@/hooks/use-station";
import { useSupplierActions } from "@/hooks/use-supplier";
import { UpdateBikeSchemaFormData } from "@/schemas";
export default function BikeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(false);
  const {
    detailBike,
    getBikeByID,
    getBikeActivityStats,
    isLoadingDetail,
    bikeActivityStats,
    bikeHistory,
    getHistoryBike,
    statisticsBike,
    isLoadingStatisticsBike,
    getStatisticsBike,
    getBikeStats,
    updateBike,
    isUpdatingBike
  } = useBikeActions({ hasToken: true, bike_detail_id: id });
  const {getAllStations,stations} = useStationActions({hasToken:true});
  const {getAllSuppliers,suppliers} = useSupplierActions({hasToken:true});
  useEffect(() => {
    getBikeByID();
    getAllStations();
    getAllSuppliers();
    getBikeActivityStats();
    getHistoryBike();
    getStatisticsBike();
    getBikeStats();
  }, [id]);
  useEffect(() => {
    if (isLoadingDetail && isLoadingStatisticsBike) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingDetail, isLoadingStatisticsBike]);
  if (!detailBike) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <p className="text-muted-foreground">
          Không tìm thấy thông tin xe đạp.
        </p>
      </div>
    );
  }
  if (isVisualLoading) {
    return <LoadingScreen />;
  }
  const handleUpdateBike = async (data: UpdateBikeSchemaFormData) => {
    await updateBike(data,id);
    getBikeByID(); // Refresh lại dữ liệu sau khi update thành công
  };
  return (
    <div className="-m-6 min-h-[calc(100vh-5rem)] bg-slate-50 p-6 dark:bg-background">
      <div className="mx-auto max-w-6xl space-y-6">
       <BikeDetailView
          bike={detailBike}
          activity={bikeActivityStats || null}
          rentals={bikeHistory?.data.data || []}
          statisticData={statisticsBike || null}
          // Truyền thêm props mới
          onUpdate={handleUpdateBike}
          stations={stations || []}
          suppliers={suppliers || []}
          isUpdating={isUpdatingBike}
        />
      </div>
    </div>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Bike, BikeStatus } from "@custom-types";
import { useBikeActions } from "@/hooks/use-bike";
import { Loader2 } from "lucide-react";
import { bikeColumn } from "@/columns/bike-colums";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { useStationActions } from "@/hooks/use-station";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import BikeManagementSkeleton from "./loading";
export default function BikeClient() {
  const [detailId, setDetailId] = useState<string>("");
  const [editId, setEditId] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit,] = useState<number>(10);
  const [statusFilter, setStatusFilter] = useState<BikeStatus | "all">("all");
  const router = useRouter();
  // const {responseStationBikeRevenue, getStationBikeRevenue} = useStationActions({ hasToken: true });
  const [editBike, setEditBike] = useState<Bike | null>(null);
  const {
    data,
    detailBike,
    // statisticData,
    // isLoadingStatistics,
    paginationBikes,
    createBike,
    updateBike,
    getBikeByID,
    isLoadingDetail,
    // bikeActivityStats,
    // getBikeActivityStats,
    // bikeStats,
    // isFetchingBikeStats,
    // bikeRentals,
    // isFetchingRentalBikes,
    // getRentalBikes,
    // getBikeStats,
    getBikes,
  } = useBikeActions(
    true,
    detailId,
    undefined,
    undefined,
    statusFilter !== "all" ? (statusFilter as BikeStatus) : undefined,
    limit,
    page
  );

  const handleViewDetails = (bikeId: string) => {
    router.push(`/admin/bikes/detail/${bikeId}`);
    setDetailId(bikeId);
  }
  const handleEditBike = (bikeId: string) => {
  setEditId(bikeId);
  getBikeByID();
};
  useEffect(() => {
    getBikes();
    console.log(data?.data?.Bikes.data);
  }, [page, limit, statusFilter, getBikes]);
  useEffect(() => {
    if (!isLoadingDetail && detailBike && editId) {
      setEditBike(detailBike);
    }
  }, [isLoadingDetail, detailBike, editId]);
  const handleUpdateBike = () => {
    if (!editBike) return;
    updateBike(
      {
        station_id: editBike.station.id,
        supplier_id: editBike.supplier.id,
        status: editBike.status,
        chip_id: editBike.chipId,
      },
      detailId
    );
  };
  useEffect(() => {
    if (detailId) {
      getBikeByID();
    }
  } , [detailId , getBikeByID]);

  useEffect(() => {
    if (editId) {
      getBikeByID();
    }
  }, [editId , getBikeByID]);
  if (!data?.data?.Bikes) {
    notFound();
  }
  if (isLoadingDetail){
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
        <Loader2 className="animate-spin w-16 h-16 text-primary" />
      </div>
    );
  }
    return (
      <Suspense fallback={<BikeManagementSkeleton />}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Quản lý xe đạp
              </h1>
              <p className="text-muted-foreground mt-1">
                Quản lý danh sách xe đạp băng chân
              </p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-4">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as BikeStatus | "all")
                }
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="Available">Có sẵn</option>
                <option value="Booked">Đang được thuê</option>
                <option value="Broken">Bị hỏng</option>
                <option value="Reserved">Đã đặt trước</option>
                <option value="Maintenance">Đang bảo trì</option>
                <option value="NotAvailable">Không có sẵn</option>
              </select>
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter("all");
                }}
              >
                Đặt lại
              </Button>
            </div>
          </div>

          <div className="w-full rounded-lg space-y-4  flex flex-col">
            <DataTable
              title="Danh sách xe đạp"
              columns={bikeColumn({
                onView: ({ id }: { id: string }) => {
                  handleViewDetails(id);
                },
                onEdit: ({ id }: { id: string }) => {
                  handleEditBike(id);
                },
              })}
              data={data?.data?.Bikes?.data || []}
            />
            <PaginationDemo
              currentPage={paginationBikes?.page ?? 1}
              onPageChange={setPage}
              totalPages={paginationBikes?.totalPages ?? 1}
            />
          </div>

          <p className="text-sm text-muted-foreground">
            Trang {paginationBikes?.page} / {paginationBikes?.totalPages} xe đạp
          </p>
        </div>
      </Suspense>
    );
}

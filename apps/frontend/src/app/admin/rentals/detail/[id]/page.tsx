"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatDateUTC } from "@/utils/formatDateTime";
import { useRentalsActions } from "@/hooks/use-rental";
import { useEffect } from "react";
export default function AdminRentalDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { detailData, isDetailLoading, getDetailRental } = useRentalsActions({
    hasToken: true,
    bike_id: id,
  });
  useEffect(() => {
    getDetailRental();
  }, [getDetailRental, id]);
  if (isDetailLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Chi tiết đơn thuê</h1>
          <Button variant="outline" onClick={() => router.back()}>
            Quay lại
          </Button>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 text-muted-foreground">
          Đang tải...
        </div>
      </div>
    );
  }

  if (isDetailLoading || !detailData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Chi tiết đơn thuê</h1>
          <Button variant="outline" onClick={() => router.back()}>
            Quay lại
          </Button>
        </div>
        <div className="rounded-lg border border-destructive/30 bg-card p-6 text-destructive">
          Không thể tải chi tiết đơn thuê.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Chi tiết đơn thuê</h1>
          <p className="text-muted-foreground mt-1">
            Mã đơn: <span className="font-medium text-foreground">{detailData.id}</span>
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Quay lại
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Trạng thái
            </label>
            <p className="text-foreground font-medium">{detailData.status}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Tổng tiền
            </label>
            <p className="text-foreground font-medium">
              {detailData.totalPrice?.toLocaleString("vi-VN")} VND
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Người dùng
            </label>
            <p className="text-foreground font-medium">{detailData.user?.fullname}</p>
            <p className="text-sm text-muted-foreground">{detailData.user?.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Số điện thoại
            </label>
            <p className="text-foreground font-medium">{detailData.user?.phoneNumber}</p>
            <p className="text-sm text-muted-foreground">
              Xác minh: {detailData.user?.verify}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Xe</label>
            <p className="text-foreground font-medium">
              {detailData.bike?.id || "Không có"}
            </p>
            <p className="text-sm text-muted-foreground">
              Chip: {detailData.bike?.chipId || "Không có"} • Trạng thái:{" "}
              {detailData.bike?.status || "Không có"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Nhà cung cấp
            </label>
            <p className="text-foreground font-medium">
              {detailData.bike?.supplierId || "Không có"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Trạm bắt đầu
            </label>
            <p className="text-foreground font-medium">{detailData.startStation?.name}</p>
            <p className="text-sm text-muted-foreground">
              {detailData.startStation?.address}
            </p>
            <p className="text-sm text-muted-foreground">
              {detailData.startStation?.latitude}, {detailData.startStation?.longitude}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Trạm kết thúc
            </label>
            <p className="text-foreground font-medium">
              {detailData.endStation?.name || "Chưa trả"}
            </p>
            <p className="text-sm text-muted-foreground">
              {detailData.endStation?.address || ""}
            </p>
            <p className="text-sm text-muted-foreground">
              {detailData.endStation
                ? `${detailData.endStation.latitude}, ${detailData.endStation.longitude}`
                : ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Thời gian bắt đầu
            </label>
            <p className="text-foreground">{formatDateUTC(detailData.startTime)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Thời gian kết thúc
            </label>
            <p className="text-foreground">
              {detailData.endTime ? formatDateUTC(detailData.endTime) : "Chưa trả"}
            </p>  
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Thời lượng (phút)
            </label>
            <p className="text-foreground font-medium">{detailData.duration}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Cập nhật lần cuối
            </label>
            <p className="text-foreground">{formatDateUTC(detailData.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}


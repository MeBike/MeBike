"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useStationActions } from "@/hooks/use-station";
import type { Station } from "@custom-types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stationSchema, StationSchemaFormData } from "@/schemas/stationSchema";
import { Input } from "@/components/ui/input";

export default function StationDetailPage() {
  const router = useRouter();
  const params = useParams<{ stationId: string }>();
  const stationId = params?.stationId ?? "";
  const [isEditing, setIsEditing] = useState(false);

  const {
    getStationByID,
    responseStationDetail,
    isLoadingGetStationByID,
    getReservationStats,
    updateStation,
  } = useStationActions({
    hasToken: true,
    stationId,
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StationSchemaFormData>({
    resolver: zodResolver(stationSchema),
    defaultValues: {
      name: "",
      address: "",
      latitude: 0,
      longitude: 0,
      capacity: 0,
    },
  });
  useEffect(() => {
    if (!stationId) return;
    getStationByID();
    getReservationStats();
  }, [stationId, getStationByID, getReservationStats]);

  const station = responseStationDetail as unknown as Station | undefined;

  const openEditForm = () => {
    if (!station) return;
    reset({
      name: station.name ?? "",
      address: station.address ?? "",
      latitude: station.latitude ?? 0,
      longitude: station.longitude ?? 0,
      capacity: station.capacity ?? 0,
    });
    setIsEditing(true);
  };

  const onSave = async (data: StationSchemaFormData) => {
    await updateStation(data);
    setIsEditing(false);
    getStationByID();
  };

  const onCancel = () => {
    setIsEditing(false);
  };

  if (!stationId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Chi tiết trạm</h1>
        <p className="text-muted-foreground">Không tìm thấy mã trạm.</p>
        <Button variant="outline" onClick={() => router.push("/admin/stations")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Chi tiết trạm xe</h1>
          <p className="text-muted-foreground mt-1">
            Thông tin trạm và thống kê liên quan
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isEditing && (
            <Button variant="default" onClick={openEditForm} disabled={!station}>
              Cập nhật
            </Button>
          )}
          <Button variant="outline" onClick={() => router.push("/admin/stations")}>
            Quay lại danh sách
          </Button>
        </div>
      </div>

      {isLoadingGetStationByID ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-4" />
          <span className="text-lg text-foreground">Đang tải dữ liệu...</span>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-6 w-full">
          {isEditing ? (
            <form className="space-y-4" onSubmit={handleSubmit(onSave)}>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Tên trạm
                </label>
                <Input type="text" {...register("name")} placeholder="Nhập tên trạm" />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Địa chỉ
                </label>
                <Input
                  type="text"
                  {...register("address")}
                  placeholder="Nhập địa chỉ trạm"
                />
                {errors.address && (
                  <p className="text-sm text-red-500 mt-1">{errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Latitude
                  </label>
                  <Input
                    type="number"
                    step="any"
                    {...register("latitude", { valueAsNumber: true })}
                  />
                  {errors.latitude && (
                    <p className="text-sm text-red-500 mt-1">{errors.latitude.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Longitude
                  </label>
                  <Input
                    type="number"
                    step="any"
                    {...register("longitude", { valueAsNumber: true })}
                  />
                  {errors.longitude && (
                    <p className="text-sm text-red-500 mt-1">{errors.longitude.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Sức chứa (số xe)
                </label>
                <Input
                  type="number"
                  {...register("capacity", { valueAsNumber: true })}
                  placeholder="Nhập sức chứa"
                />
                {errors.capacity && (
                  <p className="text-sm text-red-500 mt-1">{errors.capacity.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                  Hủy
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  Lưu
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Tên trạm
                </label>
                <p className="text-foreground font-medium">{station?.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Địa chỉ
                </label>
                <p className="text-foreground">{station?.address}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Latitude
                  </label>
                  <p className="text-foreground">{station?.latitude}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Longitude
                  </label>
                  <p className="text-foreground">{station?.longitude}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Sức chứa
                </label>
                <p className="text-foreground">{station?.capacity} xe</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Ngày tạo
                  </label>
                  <p className="text-foreground text-sm">
                    {station?.createdAt
                      ? new Date(station.createdAt).toLocaleDateString("vi-VN")
                      : "-"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Cập nhật lần cuối
                  </label>
                  <p className="text-foreground text-sm">
                    {station?.updatedAt
                      ? new Date(station.updatedAt).toLocaleDateString("vi-VN")
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isEditing && (
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-lg font-semibold text-foreground">
                Tình trạng xe tại trạm
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Tổng số xe
                  </label>
                  <p className="text-foreground font-medium">
                    {station?.totalBikes ?? 0}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Đang sẵn sàng
                  </label>
                  <p className="text-foreground font-medium">
                    {station?.availableBikes ?? 0}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Đang được thuê / đặt
                  </label>
                  <p className="text-foreground font-medium">
                    {station?.bookedBikes ?? 0}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Đang bảo trì
                  </label>
                  <p className="text-foreground font-medium">
                    {station?.maintainedBikes ?? 0}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Xe hỏng
                  </label>
                  <p className="text-foreground font-medium">
                    {station?.brokenBikes ?? 0}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Đã đặt trước
                  </label>
                  <p className="text-foreground font-medium">
                    {station?.reservedBikes ?? 0}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Không khả dụng
                  </label>
                  <p className="text-foreground font-medium">
                    {station?.unavailableBikes ?? 0}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Chỗ trống còn lại
                  </label>
                  <p className="text-foreground font-medium">
                    {station?.emptySlots ?? 0}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


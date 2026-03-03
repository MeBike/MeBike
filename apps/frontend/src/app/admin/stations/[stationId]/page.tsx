"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useStationActions } from "@/hooks/use-station";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stationSchema, StationSchemaFormData } from "@/schemas/stationSchema";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Edit, Save, X, Bike, Info } from "lucide-react";
import { Station } from "@/types";

export default function StationDetailPage() {
  const router = useRouter();
  const { stationId } = useParams() as { stationId: string };
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

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<StationSchemaFormData>({
    resolver: zodResolver(stationSchema),
  });

  useEffect(() => {
    if (stationId) {
      getStationByID();
      getReservationStats();
    }
  }, [stationId, getStationByID, getReservationStats]);

  // Xử lý logic 404
  if (!isLoadingGetStationByID && !responseStationDetail) {
    notFound();
  }

  const station = responseStationDetail as Station;

  const handleEdit = () => {
    reset({
      name: station?.name || "",
      address: station?.address || "",
      latitude: station?.latitude || 0,
      longitude: station?.longitude || 0,
      capacity: station?.capacity || 0,
    });
    setIsEditing(true);
  };

  const onSave = async (data: StationSchemaFormData) => {
    const success = await updateStation(data);
    if (success) {
      setIsEditing(false);
      getStationByID();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      {/* HEADER BREADCRUMB-LIKE */}
      <div className="flex items-center justify-between border-b pb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/admin/stations")}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{isEditing ? "Chỉnh sửa trạm" : "Chi tiết trạm"}</h1>
            <p className="text-muted-foreground">{station?.name || "Đang tải..."}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" /> Cập nhật
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4 mr-2" /> Hủy
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* THÔNG TIN CHÍNH */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" /> Thông tin cơ bản
            </h3>
            
            {isEditing ? (
              <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1">
                    <label className="text-sm font-medium">Tên trạm</label>
                    <Input {...register("name")} />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-sm font-medium">Địa chỉ</label>
                    <Input {...register("address")} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Vĩ độ (Lat)</label>
                    <Input type="number"  {...register("latitude", { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Kinh độ (Long)</label>
                    <Input type="number" {...register("longitude", { valueAsNumber: true })} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-sm font-medium">Sức chứa</label>
                    <Input type="number" {...register("capacity", { valueAsNumber: true })} />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  <Save className="w-4 h-4 mr-2" /> Lưu thay đổi
                </Button>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-y-6">
                <DetailItem label="Tên trạm" value={station?.name} />
                <DetailItem label="Sức chứa" value={`${station?.capacity} xe`} />
                <DetailItem label="Địa chỉ" value={station?.address} isFullWidth />
                <DetailItem label="Tọa độ" value={`${station?.latitude}, ${station?.longitude}`} />
                <DetailItem label="Ngày tạo" value={station?.createdAt && new Date(station.createdAt).toLocaleDateString("vi-VN")} />
              </div>
            )}
          </div>
        </div>

        {/* THỐNG KÊ NHANH (BIKES STATUS) */}
        {!isEditing && (
          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Bike className="w-5 h-5 text-primary" /> Trạng thái xe
              </h3>
              <div className="space-y-3">
                <StatusRow label="Tổng số xe" value={station?.totalBikes} />
                <StatusRow label="Sẵn sàng" value={station?.availableBikes} highlightColor="text-green-600" />
                <StatusRow label="Đang thuê" value={station?.bookedBikes} highlightColor="text-blue-600" />
                <StatusRow label="Bảo trì" value={station?.maintainedBikes} highlightColor="text-orange-500" />
                <div className="pt-3 border-t">
                    <StatusRow label="Chỗ trống còn lại" value={station?.emptySlots} isBold />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-components nội bộ
interface DetailItemProps {
  label: string;
  value: string | number | null | undefined;
  isFullWidth?: boolean;
}
function DetailItem({ label, value, isFullWidth }: DetailItemProps) {
  return (
    <div className={isFullWidth ? "col-span-2" : ""}>
      <p className="text-xs text-muted-foreground uppercase font-semibold">{label}</p>
      <p className="text-foreground mt-1 font-medium">{value || "---"}</p>
    </div>
  );
}
interface StatusRowProps {
  label: string;
  value: string | number | null | undefined;
  highlightColor?: string;
  isBold?: boolean;
}
function StatusRow({ label, value, highlightColor = "", isBold = false }: StatusRowProps) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${isBold ? "font-bold text-base" : "font-semibold"} ${highlightColor}`}>
        {value ?? 0}
      </span>
    </div>
  );
}
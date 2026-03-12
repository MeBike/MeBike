"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useStationActions } from "@/hooks/use-station";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stationSchema, StationSchemaFormData } from "@/schemas/station-schema";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Edit, Save, X, Bike, Info, MapPin, Calendar } from "lucide-react";
import { Station } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { UseFormRegisterReturn } from "react-hook-form";
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

  const fetchData = useCallback(async () => {
    if (stationId) {
      await Promise.all([getStationByID(), getReservationStats()]);
    }
  }, [stationId, getStationByID, getReservationStats]);

  useEffect(() => {
    fetchData();
    setIsEditing(false);
  }, [stationId]);

  if (isLoadingGetStationByID) {
    return <StationDetailSkeleton />;
  }

  if (!responseStationDetail && !isLoadingGetStationByID) {
    notFound();
    return null;
  }

  const station = responseStationDetail as Station;

  const handleEdit = () => {
    reset({
      name: station.name,
      address: station.address,
      latitude: station.latitude,
      longitude: station.longitude,
      capacity: station.capacity,
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
    <div className="max-w-6xl mx-auto space-y-6 p-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b pb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/admin/stations")} className="rounded-full">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditing ? "Cập nhật trạm" : "Chi tiết trạm"}
            </h1>
            <p className="text-muted-foreground font-medium">
              {isEditing ? `Đang chỉnh sửa: ${station.name}` : station.name}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={handleEdit} className="shadow-md">
              <Edit className="w-4 h-4 mr-2" /> Chỉnh sửa
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4 mr-2" /> Hủy bỏ
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-primary">
              <Info className="w-5 h-5" /> Thông tin quản lý
            </h3>
            
            {isEditing ? (
              <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput label="Tên trạm" register={register("name")} error={errors.name?.message} />
                  <FormInput label="Sức chứa" type="number" register={register("capacity", { valueAsNumber: true })} error={errors.capacity?.message} />
                  <div className="md:col-span-2">
                    <FormInput label="Địa chỉ" register={register("address")} error={errors.address?.message} />
                  </div>
                  <FormInput label="Vĩ độ (Lat)" type="number" register={register("latitude", { valueAsNumber: true })}/>
                  <FormInput label="Kinh độ (Long)" type="number" register={register("longitude", { valueAsNumber: true })} />
                </div>
                <Button type="submit" className="w-full mt-6 py-6 text-base" disabled={isSubmitting}>
                  <Save className="w-5 h-5 mr-2" /> {isSubmitting ? "Đang lưu..." : "Xác nhận thay đổi"}
                </Button>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                <DetailItem icon={<Info className="w-4 h-4" />} label="Tên trạm" value={station.name} />
                <DetailItem icon={<Bike className="w-4 h-4" />} label="Sức chứa tối đa" value={`${station.capacity} xe`} />
                <DetailItem icon={<MapPin className="w-4 h-4" />} label="Địa chỉ" value={station.address} isFullWidth />
                <DetailItem icon={<MapPin className="w-4 h-4" />} label="Tọa độ GPS" value={`${station.latitude?.toFixed(6)}, ${station.longitude?.toFixed(6)}`} />
                <DetailItem icon={<Calendar className="w-4 h-4" />} label="Ngày khởi tạo" value={station.createdAt ? new Date(station.createdAt).toLocaleDateString("vi-VN", { dateStyle: 'long' }) : "---"} />
              </div>
            )}
          </div>
        </div>
        {!isEditing && (
          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Bike className="w-5 h-5 text-primary" /> Trạng thái vận hành
              </h3>
              <div className="space-y-4">
                <StatusRow label="Tổng số xe" value={station.totalBikes} />
                <StatusRow label="Sẵn sàng" value={station.availableBikes} highlightColor="text-green-600" />
                <StatusRow label="Đang đặt" value={station.bookedBikes} highlightColor="text-blue-600" />
                <StatusRow label="Bảo trì" value={station.maintainedBikes} highlightColor="text-orange-500" />
                <div className="pt-4 mt-4 border-t border-primary/10">
                    <StatusRow label="Vị trí trống" value={station.emptySlots} isBold />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  register: UseFormRegisterReturn;
}
function FormInput({ label, error, register, ...props }: FormInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-foreground/80">{label}</label>
      <Input {...register} {...props} className={error ? "border-destructive" : ""} />
      {error && <p className="text-[11px] font-medium text-destructive">{error}</p>}
    </div>
  );
}
interface DetailItemProps {
  label: string;
  value: string | number | null | undefined;
  icon: React.ReactNode;
  isFullWidth?: boolean;
}
function DetailItem({ label, value, isFullWidth, icon }: DetailItemProps) {
  return (
    <div className={isFullWidth ? "md:col-span-2" : ""}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-muted-foreground">{icon}</span>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-foreground font-semibold text-base leading-snug pl-6">{value || "---"}</p>
    </div>
  );
}

interface StatusRowProps {
  label: string;
  value: number | null | undefined;
  highlightColor?: string;
  isBold?: boolean;
}
function StatusRow({ label, value, highlightColor = "", isBold = false }: StatusRowProps) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className={`${isBold ? "font-extrabold text-xl" : "font-bold text-base"} ${highlightColor}`}>
        {value ?? 0}
      </span>
    </div>
  );
}
function StationDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      <div className="flex justify-between items-center border-b pb-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
        <div>
          <Skeleton className="h-[300px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
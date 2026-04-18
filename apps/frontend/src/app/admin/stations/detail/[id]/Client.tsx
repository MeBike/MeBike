"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stationSchema, StationSchemaFormData } from "@/schemas/station-schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, Edit, Save, X, Bike, Info, MapPin, 
  Clock, LayoutGrid, Activity, CheckCircle2, 
  AlertTriangle, Wrench, Ban, LucideIcon 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatToVNTime } from "@/lib/formatVNDate";
import type { Station } from "@/types";

// --- REUSABLE COMPONENTS ---
function SectionCard({ icon: Icon, title, children, footer, className }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode; footer?: React.ReactNode; className?: string; }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm", className)}>
      <div className="flex items-center gap-2 border-b border-border/60 px-5 py-4">
        <Icon className="h-5 w-5 shrink-0 text-primary" />
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
      {footer}
    </div>
  );
}

function Field({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function StatusItem({ icon: Icon, label, value, color }: { icon: LucideIcon, label: string, value: number, color: string }) {
  return (
    <div className="flex items-center justify-between text-sm py-1 border-b border-border/40 last:border-0">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", color)} />
        <span className="text-muted-foreground">{label}</span>
      </div>
      <span className={cn("font-bold", color)}>{value}</span>
    </div>
  );
}

function StationDetailSkeleton() {
  return (
    <div className="-m-6 min-h-[calc(100vh-5rem)] bg-slate-50 p-6 dark:bg-background">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-28" />
        </div>
        <Skeleton className="h-14 w-full rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
          <Skeleton className="h-[500px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---

interface StationDetailClientProps {
  id: string;
  station: Station;
  isLoading: boolean;
  onUpdateStation: (data: StationSchemaFormData) => Promise<boolean>;
}

export default function StationDetailClient({
  id,
  station,
  isLoading,
  onUpdateStation,
}: StationDetailClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<StationSchemaFormData>({
    resolver: zodResolver(stationSchema),
  });

  if (isLoading || !station) return <StationDetailSkeleton />;

  const handleEdit = () => {
    reset({
      name: station.name,
      address: station.address,
      latitude: station.location.latitude,
      longitude: station.location.longitude,
      totalCapacity: station.capacity.total,
    });
    setIsEditing(true);
  };

  const onSave = async (data: StationSchemaFormData) => {
    const success = await onUpdateStation(data);
    if (success) {
      setIsEditing(false);
    }
  };

  return (
    <div className="-m-6 min-h-[calc(100vh-5rem)] bg-slate-50 p-6 dark:bg-background">
      <div className="mx-auto max-w-6xl space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => router.push("/admin/stations")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {isEditing ? "Chỉnh sửa trạm" : "Chi tiết trạm"}
            </h1>
            {!isEditing && (
              <Badge variant="outline" className="rounded-full px-3 py-0.5 font-semibold bg-primary/5 text-primary border-primary/20">
                Station Active
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            {!isEditing ? (
              <Button onClick={handleEdit} className="shrink-0">
                <Edit className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(false)} className="shrink-0">
                <X className="mr-2 h-4 w-4" />
                Hủy bỏ
              </Button>
            )}
          </div>
        </div>

        {/* Metadata Bar */}
        <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-1">
          <div>
            <span className="text-muted-foreground">ID Trạm: </span>
            <span className="font-mono text-xs text-foreground">{station.id}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Khởi tạo: </span>
            <span className="text-foreground">{formatToVNTime(station.createdAt)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Cập nhật: </span>
            <span className="text-foreground">{formatToVNTime(station.updatedAt)}</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column: Info & Map */}
          <div className="space-y-6 lg:col-span-2">
            <SectionCard icon={Info} title="Thông tin quản lý">
              {isEditing ? (
                <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Tên trạm</label>
                      <Input {...register("name")} className={errors.name ? "border-destructive" : ""} />
                      {errors.name && <p className="text-[10px] text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Sức chứa tổng</label>
                      <Input type="number" {...register("totalCapacity", { valueAsNumber: true })} />
                      {errors.totalCapacity && <p className="text-[10px] text-destructive">{errors.totalCapacity.message}</p>}
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Địa chỉ cụ thể</label>
                      <Input {...register("address")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Vĩ độ (Latitude)</label>
                      <Input type="number" step="any" {...register("latitude", { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Kinh độ (Longitude)</label>
                      <Input type="number" step="any" {...register("longitude", { valueAsNumber: true })} />
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      <Save className="w-4 h-4 mr-2" />
                      {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                  <Field label="Tên trạm" value={station.name} />
                  <Field label="Tọa độ GPS" value={`${station.location.latitude}, ${station.location.longitude}`} />
                  <Field label="Địa chỉ" value={station.address} className="md:col-span-2" />
                </div>
              )}
            </SectionCard>

            <SectionCard icon={LayoutGrid} title="Cấu hình sức chứa">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-lg bg-muted/30 p-3 border border-border/40 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Tổng Slots</p>
                  <p className="text-xl font-bold text-foreground">{station.capacity.total}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 border border-border/40 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Trả xe tối đa</p>
                  <p className="text-xl font-bold text-foreground">{station.capacity.returnSlotLimit}</p>
                </div>
                <div className="rounded-lg bg-primary/5 p-3 border border-primary/20 text-center">
                  <p className="text-[10px] text-primary uppercase font-bold">Vị trí trống</p>
                  <p className="text-xl font-extrabold text-primary">{station.capacity.emptyPhysicalSlots}</p>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Right Column: Bike Statistics */}
          <div className="space-y-6">
            <SectionCard icon={Activity} title="Thống kê xe tại trạm">
              <div className="space-y-4">
                <div className="rounded-lg border border-primary/15 bg-primary/5 px-4 py-5 text-center">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Tổng số xe</p>
                  <p className="mt-1 text-4xl font-bold text-primary">{station.bikes.total}</p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <StatusItem icon={CheckCircle2} label="Sẵn sàng" value={station.bikes.available} color="text-green-600" />
                  <StatusItem icon={Clock} label="Đang đặt trước" value={station.bikes.reserved} color="text-amber-600" />
                  <StatusItem icon={Bike} label="Đang thuê" value={station.bikes.booked} color="text-blue-600" />
                  <StatusItem icon={Wrench} label="Đang bảo trì" value={station.bikes.maintained} color="text-orange-500" />
                  <StatusItem icon={AlertTriangle} label="Hỏng hóc" value={station.bikes.broken} color="text-red-500" />
                  <StatusItem icon={Ban} label="Không khả dụng" value={station.bikes.unavailable} color="text-muted-foreground" />
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}
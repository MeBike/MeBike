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
  ArrowLeft,
  Info,
  Activity,
  LayoutGrid,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Ban,
  HelpCircle,
  LucideIcon,
  Truck,
  RefreshCcw,
  ShieldAlert,
  MapPin,
  Bike,
  Wallet,
  CalendarCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Station } from "@/types";

// --- INTERFACES ---
interface StationReport {
  id: string;
  name: string;
  address: string;
  totalRentals: number;
  totalRevenue: number;
  totalDuration: number;
  avgDuration: number;
}

interface StationDetailClientProps {
  id: string;
  station: Station;
  isLoading: boolean;
  onUpdateStation: (data: StationSchemaFormData) => Promise<boolean>;
  revenueData?: StationReport;
}

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Quản trị viên",
  MANAGER: "Quản lý trạm",
  STAFF: "Nhân viên trạm",
  TECHNICIAN: "Kỹ thuật viên",
  AGENCY: "Agency",
  USER: "Khách hàng",
};

// --- REUSABLE COMPONENTS ---
function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass,
  bgClass,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-5 shadow-sm">
      <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full", bgClass)}>
        <Icon className={cn("h-6 w-6", colorClass)} />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="mt-0.5 text-2xl font-bold text-foreground">{value}</h3>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border/50 bg-card shadow-sm h-full", className)}>
      <div className="flex items-center gap-2 border-b border-border/30 px-6 py-4">
        <Icon className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</p>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function StatusItem({ icon: Icon, label, value, color, boldValue = false }: { icon: LucideIcon; label: string; value: number; color: string; boldValue?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-3">
        <div className={cn("p-1.5 rounded-md bg-muted/50", color.replace("text-", "text-").replace("500", "500").replace("600", "600"))}>
           <Icon className={cn("h-4 w-4", color)} />
        </div>
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
      </div>
      <span className={cn("text-sm", boldValue ? "font-bold" : "font-semibold", color)}>{value}</span>
    </div>
  );
}

function ErrorMsg({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-[11px] font-medium text-destructive">{message}</p>;
}

// --- MAIN COMPONENT ---
export default function StationDetailClient({
  id,
  station,
  isLoading,
  onUpdateStation,
  revenueData,
}: StationDetailClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StationSchemaFormData>({ resolver: zodResolver(stationSchema) });

  if (isLoading || !station) return <Skeleton className="h-[80vh] w-full rounded-xl" />;

  const handleEdit = () => {
    reset({
      name: station.name,
      address: station.address,
      latitude: station.location.latitude,
      longitude: station.location.longitude,
      totalCapacity: station.capacity.total,
      stationType: station.stationType,
      returnSlotLimit: station.capacity.returnSlotLimit,
    });
    setIsEditing(true);
  };

  const onSave = async (data: StationSchemaFormData) => {
    if (await onUpdateStation(data)) setIsEditing(false);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50/50 dark:bg-background pb-10">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => router.push("/admin/stations")} className="h-9 w-9 rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  {isEditing ? "Chỉnh sửa trạm" : station.name}
                </h1>
                {!isEditing && (
                  <Badge variant={station.stationType === "AGENCY" ? "default" : "secondary"} className="rounded-full px-3">
                    {station.stationType}
                  </Badge>
                )}
              </div>
              {!isEditing && <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3 w-3"/> {station.address}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            {isEditing && (
              <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSubmitting}>
                Hủy
              </Button>
            )}
            <Button onClick={isEditing ? handleSubmit(onSave) : handleEdit} disabled={isSubmitting} className="min-w-[120px]">
              {isEditing ? (isSubmitting ? "Đang lưu..." : "Lưu thay đổi") : "Chỉnh sửa thông tin"}
            </Button>
          </div>
        </div>

        {/* TOP METRICS (Hàng ngang 4 thẻ, rất cân đối) */}
        {!isEditing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Tổng doanh thu"
              value={revenueData ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(revenueData.totalRevenue) : "0 ₫"}
              icon={Wallet}
              colorClass="text-emerald-600 dark:text-emerald-400"
              bgClass="bg-emerald-100 dark:bg-emerald-500/10"
            />
            <MetricCard
              title="Tổng lượt thuê"
              value={revenueData?.totalRentals || 0}
              subtitle={revenueData ? `TB: ${Math.round(revenueData.avgDuration)} phút/lượt` : ""}
              icon={CalendarCheck}
              colorClass="text-blue-600 dark:text-blue-400"
              bgClass="bg-blue-100 dark:bg-blue-500/10"
            />
            <MetricCard
              title="Tổng vị trí bãi đỗ"
              value={station.capacity.total}
              subtitle={`Còn trống: ${station.returnSlots.available} chỗ`}
              icon={LayoutGrid}
              colorClass="text-indigo-600 dark:text-indigo-400"
              bgClass="bg-indigo-100 dark:bg-indigo-500/10"
            />
            <MetricCard
              title="Xe thực tế tại trạm"
              value={station.capacity.totalInStationBikes}
              subtitle={`Sẵn sàng: ${station.bikes.available} xe`}
              icon={Bike}
              colorClass="text-amber-600 dark:text-amber-400"
              bgClass="bg-amber-100 dark:bg-amber-500/10"
            />
          </div>
        )}

        {/* MIDDLE CONTENT GRID (Chia tỷ lệ 2 Cột Trái - 1 Cột Phải) */}
        <div className="grid gap-6 lg:grid-cols-3 items-start">
          
          {/* CỘT TRÁI (Chiếm 2 phần) */}
          <div className="lg:col-span-2 space-y-6">
            <SectionCard icon={Info} title="Thông tin chung">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2 sm:col-span-1 space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase">Tên trạm</label>
                    <Input {...register("name")} className={cn(errors.name && "border-destructive")} />
                    <ErrorMsg message={errors.name?.message} />
                  </div>
                  <div className="col-span-2 sm:col-span-1 space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase">Loại trạm</label>
                    <select {...register("stationType")} className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm", errors.stationType && "border-destructive")}>
                      <option value="INTERNAL">INTERNAL (Nội bộ)</option>
                      <option value="AGENCY">AGENCY (Đại lý)</option>
                    </select>
                    <ErrorMsg message={errors.stationType?.message} />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase">Địa chỉ chi tiết</label>
                    <Input {...register("address")} className={cn(errors.address && "border-destructive")} />
                    <ErrorMsg message={errors.address?.message} />
                  </div>
                  <div className="col-span-2 sm:col-span-1 space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase">Vĩ độ (Latitude)</label>
                    <Input type="number" step="any" {...register("latitude", { valueAsNumber: true })} className={cn(errors.latitude && "border-destructive")} />
                    <ErrorMsg message={errors.latitude?.message} />
                  </div>
                  <div className="col-span-2 sm:col-span-1 space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase">Kinh độ (Longitude)</label>
                    <Input type="number" step="any" {...register("longitude", { valueAsNumber: true })} className={cn(errors.longitude && "border-destructive")} />
                    <ErrorMsg message={errors.longitude?.message} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  <Field label="Tên trạm" value={station.name} />
                  <Field label="Loại trạm" value={station.stationType} />
                  <Field label="Địa chỉ" value={station.address} className="col-span-2" />
                  <Field label="Tọa độ" value={`${station.location.latitude}, ${station.location.longitude}`} className="col-span-2 sm:col-span-1" />
                  {station.agencyId && <Field label="Mã đại lý" value={<code className="text-xs bg-muted p-1.5 rounded-md">{station.agencyId}</code>} className="col-span-2 sm:col-span-1" />}
                </div>
              )}
            </SectionCard>

            <SectionCard icon={Users} title="Nhân viên phụ trách">
              {station.workers?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {station.workers.map((w) => (
                    <div key={w.userId} className="flex items-center gap-3 p-3.5 rounded-xl border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {w.fullName.charAt(0)}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold truncate">{w.fullName}</p>
                        <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{ROLE_LABELS[w.role]}</p>
                      </div>
                      {w.technicianTeamId && (
                         <Badge variant="outline" className="text-[10px] whitespace-nowrap bg-background">Team {w.technicianTeamName}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center border-2 border-dashed border-border/50 rounded-xl">
                  <Users className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Chưa có nhân viên nào được phân công.</p>
                </div>
              )}
            </SectionCard>
          </div>

          {/* CỘT PHẢI (Chiếm 1 phần) */}
          <div className="lg:col-span-1">
            <SectionCard icon={LayoutGrid} title="Quản lý chỗ đỗ">
              {isEditing ? (
                <div className="grid gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase">Tổng sức chứa</label>
                    <Input type="number" {...register("totalCapacity", { valueAsNumber: true })} />
                    <ErrorMsg message={errors.totalCapacity?.message} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase">Tối đa khách trả</label>
                    <Input type="number" {...register("returnSlotLimit", { valueAsNumber: true })} />
                    <ErrorMsg message={errors.returnSlotLimit?.message} />
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border/50">
                     <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Chỗ trống hiện tại</p>
                        <p className="text-3xl font-bold text-foreground">{station.returnSlots.available} <span className="text-sm font-normal text-muted-foreground">/ {station.capacity.total}</span></p>
                     </div>
                     <LayoutGrid className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                  <div className="space-y-1 px-1">
                    <StatusItem icon={Activity} label="Chỗ khách trả xe" value={station.returnSlots.active} color="text-blue-600" />
                    <StatusItem icon={Wrench} label="Chỗ xe điều phối" value={station.redistributionSlots} color="text-orange-500" />
                    <div className="pt-3 mt-3 border-t border-border/40 flex justify-between text-sm">
                      <span className="text-muted-foreground">Giới hạn khách trả:</span>
                      <span className="font-semibold">{station.capacity.returnSlotLimit}</span>
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
          
        </div>

        {/* BOTTOM SECTION - TRẠNG THÁI PHƯƠNG TIỆN (Dàn ngang mượt mà, giải quyết vấn đề thọt) */}
        {!isEditing && (
          <SectionCard icon={Activity} title="Chi tiết trạng thái phương tiện" className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:divide-x divide-y md:divide-y-0 divide-border/40">
              
              {/* Cột 1: Tại trạm */}
              <div className="pt-4 md:pt-0 first:pt-0 md:pr-4">
                <h4 className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-4">
                  <MapPin className="h-3.5 w-3.5" /> Trực tiếp tại trạm
                </h4>
                <div className="space-y-1">
                  <StatusItem icon={CheckCircle2} label="Sẵn sàng cho thuê" value={station.bikes.available} color="text-emerald-600" boldValue />
                  <StatusItem icon={Clock} label="Đã đặt trước (Booked)" value={station.bikes.booked} color="text-amber-600" />
                </div>
              </div>

              {/* Cột 2: Luân chuyển */}
              <div className="pt-6 md:pt-0 md:px-4">
                <h4 className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-4">
                  <RefreshCcw className="h-3.5 w-3.5" /> Luân chuyển & Điều phối
                </h4>
                <div className="space-y-1">
                  <StatusItem icon={Wrench} label="Chuẩn bị điều phối" value={station.bikes.pendingDispatch} color="text-orange-500" />
                  <StatusItem icon={RefreshCcw} label="Đang đổi xe" value={station.bikes.swapping} color="text-blue-500" />
                  <StatusItem icon={Truck} label="Đang vận chuyển" value={station.bikes.transporting} color="text-indigo-500" />
                </div>
              </div>

              {/* Cột 3: Sự cố */}
              <div className="pt-6 md:pt-0 md:pl-4">
                <h4 className="flex items-center gap-2 text-[11px] font-bold text-destructive uppercase tracking-wider mb-4">
                  <ShieldAlert className="h-3.5 w-3.5" /> Sự cố & Ngưng hoạt động
                </h4>
                <div className="space-y-1">
                  <StatusItem icon={AlertTriangle} label="Xe đang hỏng" value={station.bikes.broken} color="text-red-500" />
                  <StatusItem icon={HelpCircle} label="Xe bị mất" value={station.bikes.lost} color="text-red-600" />
                  <StatusItem icon={Ban} label="Tạm ngưng hệ thống" value={station.bikes.disabled} color="text-slate-500" />
                </div>
              </div>

            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stationSchema, StationSchemaFormData } from "@/schemas/station-schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatToVNTime } from "@/lib/formatVNDate";
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
  CalendarCheck,
  Hammer,
  PieChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Station } from "@/types";
import { StationLayoutMap } from "@/components/StationLayoutMap";

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
    <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-background p-6 shadow-sm transition-all hover:shadow-md hover:border-border/80 group">
      {/* Background decoration */}
      <div
        className={cn(
          "absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-50 blur-2xl transition-all group-hover:scale-110",
          bgClass,
        )}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex flex-col">
            <span className="text-3xl font-bold tracking-tight text-foreground">
              {value}
            </span>
            {subtitle && (
              <span className="mt-1 text-xs font-medium text-muted-foreground">
                {subtitle}
              </span>
            )}
          </div>
        </div>
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            bgClass,
          )}
        >
          <Icon className={cn("h-6 w-6", colorClass)} />
        </div>
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
    <div
      className={cn(
        "rounded-2xl border border-border/50 bg-background shadow-sm flex flex-col overflow-hidden",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border/40 px-6 py-4 bg-muted/20">
        <Icon className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-6 flex-1">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}
      </p>
      <div className="text-sm font-medium text-foreground bg-muted/20 px-3 py-2 rounded-lg border border-border/40">
        {value}
      </div>
    </div>
  );
}

function StatusItem({
  icon: Icon,
  label,
  value,
  color,
  boldValue = false,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  color: string;
  boldValue?: boolean;
}) {
  // Thay đổi màu sắc tự động cho bg dựa trên text color
  const bgColor = color.replace("text-", "bg-").concat("/10");

  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-border/30 hover:bg-muted/20 transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", bgColor)}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
        <span className="text-sm font-medium text-foreground/80">{label}</span>
      </div>
      <Badge
        variant="outline"
        className={cn(
          "px-2.5 py-0.5 text-sm",
          boldValue ? "font-bold" : "font-semibold",
          color,
          bgColor,
          "border-transparent",
        )}
      >
        {value}
      </Badge>
    </div>
  );
}

function ErrorMsg({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs font-medium text-destructive flex items-center gap-1">
      <AlertTriangle className="w-3 h-3" /> {message}
    </p>
  );
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

  if (isLoading || !station)
    return (
      <div className="p-8">
        <Skeleton className="h-[80vh] w-full rounded-2xl" />
      </div>
    );

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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-background pb-12 pt-6">
      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        {/* HEADER & METADATA */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push("/admin/stations")}
                className="h-10 w-10 rounded-full bg-white dark:bg-card hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {isEditing ? "Chỉnh sửa trạm" : station.name}
                  </h1>
                  {!isEditing && (
                    <Badge
                      variant={
                        station.stationType === "INTERNAL"
                          ? "default"
                          : "secondary"
                      }
                      className="rounded-full px-3 shadow-sm"
                    >
                      {station.stationType === "INTERNAL"
                        ? "Trạm nội bộ"
                        : "Trạm đối tác"}
                    </Badge>
                  )}
                </div>
                {!isEditing && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {station.address}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              {isEditing && (
                <Button
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                  className="rounded-full"
                >
                  Hủy
                </Button>
              )}
              <Button
                onClick={isEditing ? handleSubmit(onSave) : handleEdit}
                disabled={isSubmitting}
                className="min-w-[140px] rounded-full shadow-md"
              >
                {isEditing
                  ? isSubmitting
                    ? "Đang lưu..."
                    : "Lưu thay đổi"
                  : "Chỉnh sửa thông tin"}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="font-mono bg-white dark:bg-card"
              >
                ID: {station.id}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Khởi tạo:{" "}
              {formatToVNTime(station.createdAt)}
            </div>
            <div className="flex items-center gap-1.5">
              <RefreshCcw className="w-3.5 h-3.5" /> Cập nhật:{" "}
              {formatToVNTime(station.updatedAt)}
            </div>
          </div>
        </div>

        {/* VIEW MODE ONLY: DASHBOARD WIDGETS */}
        {!isEditing && (
          <div className="space-y-8">
            {/* TẦNG 1: 4 CỘT METRICS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <MetricCard
                title="Doanh thu"
                value={
                  revenueData
                    ? new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(revenueData.totalRevenue)
                    : "0 ₫"
                }
                icon={Wallet}
                colorClass="text-emerald-600 dark:text-emerald-400"
                bgClass="bg-emerald-100 dark:bg-emerald-500/20"
              />
              <MetricCard
                title="Lượt thuê"
                value={revenueData?.totalRentals || 0}
                subtitle={
                  revenueData
                    ? `TB: ${Math.round(revenueData.avgDuration)} phút/lượt`
                    : ""
                }
                icon={CalendarCheck}
                colorClass="text-blue-600 dark:text-blue-400"
                bgClass="bg-blue-100 dark:bg-blue-500/20"
              />
              <MetricCard
                title="Vị trí đỗ xe"
                value={station.capacity.total}
                subtitle={`Còn trống: ${station.returnSlots.available} chỗ`}
                icon={LayoutGrid}
                colorClass="text-indigo-600 dark:text-indigo-400"
                bgClass="bg-indigo-100 dark:bg-indigo-500/20"
              />
              <MetricCard
                title="Xe thực tế tại trạm"
                value={station.capacity.totalInStationBikes}
                subtitle={`Sẵn sàng: ${station.bikes.available} xe`}
                icon={Bike}
                colorClass="text-amber-600 dark:text-amber-400"
                bgClass="bg-amber-100 dark:bg-amber-500/20"
              />
            </div>

            {/* TẦNG 2: BẢN ĐỒ 2D VÀ CHI TIẾT TRẠNG THÁI */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Sơ đồ bãi đỗ chiếm 2/3 không gian trên màn to */}
              <div className="xl:col-span-2">
                <StationLayoutMap station={station} />
              </div>

              {/* Phân bổ chỗ đỗ chiếm 1/3 */}
              <div className="xl:col-span-1">
                <SectionCard
                  icon={PieChart}
                  title="Phân bổ không gian bãi đỗ"
                  className="h-full"
                >
                  <div className="flex flex-col items-center justify-center py-4 mb-6 bg-muted/20 rounded-xl border border-border/40">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Chỗ trống hiện tại
                    </p>
                    <p className="text-4xl font-black text-foreground">
                      {station.returnSlots.available}{" "}
                      <span className="text-lg font-medium text-muted-foreground">
                        / {station.capacity.total}
                      </span>
                    </p>
                  </div>
                  <div className="space-y-3">
                    <StatusItem
                      icon={Activity}
                      label="Chỗ chờ khách trả xe"
                      value={station.returnSlots.active}
                      color="text-blue-600"
                    />
                    <StatusItem
                      icon={Wrench}
                      label="Chỗ chờ xe điều phối"
                      value={station.redistributionSlots}
                      color="text-orange-500"
                    />
                  </div>
                </SectionCard>
              </div>

              {/* Chi tiết xe chiếm full width ở dưới (chia 3 cột nội bộ) */}
              <div className="xl:col-span-3">
                <SectionCard
                  icon={Activity}
                  title="Chi tiết trạng thái phương tiện"
                  className="w-full"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Nhóm 1 */}
                    <div className="bg-muted/10 rounded-xl p-5 border border-border/30">
                      <h4 className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 pb-2 border-b border-border/40">
                        <MapPin className="h-4 w-4" /> Xe nội trạm
                      </h4>
                      <div className="space-y-2.5">
                        <StatusItem
                          icon={CheckCircle2}
                          label="Sẵn sàng cho thuê"
                          value={station.bikes.available}
                          color="text-emerald-600"
                          boldValue
                        />
                        <StatusItem
                          icon={Clock}
                          label="Đã đặt trước"
                          value={station.bikes.reserved}
                          color="text-amber-600"
                        />
                        <StatusItem
                          icon={Wrench}
                          label="Chuẩn bị điều phối"
                          value={station.bikes.pendingDispatch}
                          color="text-orange-500"
                        />
                        <StatusItem
                          icon={AlertTriangle}
                          label="Đang bị hỏng"
                          value={station.bikes.broken}
                          color="text-red-500"
                        />
                        <StatusItem
                          icon={Hammer}
                          label="Đã sửa"
                          value={station.bikes.fixed}
                          color="text-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Nhóm 2 */}
                    <div className="bg-muted/10 rounded-xl p-5 border border-border/30">
                      <h4 className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 pb-2 border-b border-border/40">
                        <RefreshCcw className="h-4 w-4" /> Xe luân chuyển
                      </h4>
                      <div className="space-y-2.5">
                        <StatusItem
                          icon={RefreshCcw}
                          label="Hỗ trợ sự cố"
                          value={station.bikes.swapping}
                          color="text-blue-500"
                        />
                        <StatusItem
                          icon={Truck}
                          label="Đang vận chuyển"
                          value={station.bikes.transporting}
                          color="text-indigo-500"
                        />
                        <StatusItem
                          icon={Bike}
                          label="Đang thuê"
                          value={station.bikes.booked}
                          color="text-blue-600"
                        />
                      </div>
                    </div>

                    {/* Nhóm 3 */}
                    <div className="bg-red-50/50 dark:bg-red-950/10 rounded-xl p-5 border border-red-100 dark:border-red-900/30">
                      <h4 className="flex items-center gap-2 text-xs font-bold text-destructive uppercase tracking-wider mb-4 pb-2 border-b border-red-100 dark:border-red-900/30">
                        <ShieldAlert className="h-4 w-4" /> Sự cố / Mất mát
                      </h4>
                      <div className="space-y-2.5">
                        <StatusItem
                          icon={HelpCircle}
                          label="Bị mất"
                          value={station.bikes.lost}
                          color="text-red-600"
                        />
                        <StatusItem
                          icon={Ban}
                          label="Tạm ngưng hệ thống"
                          value={station.bikes.disabled}
                          color="text-slate-500"
                        />
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>
          </div>
        )}

        {/* TẦNG 3: THÔNG TIN CƠ BẢN VÀ NHÂN SỰ */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard icon={Info} title="Thông tin cơ bản">
            {isEditing ? (
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 sm:col-span-1 space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Tên trạm
                  </label>
                  <Input
                    {...register("name")}
                    className={cn(
                      "bg-muted/20",
                      errors.name && "border-destructive",
                    )}
                  />
                  <ErrorMsg message={errors.name?.message} />
                </div>
                <div className="col-span-2 sm:col-span-1 space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Loại trạm
                  </label>
                  <select
                    {...register("stationType")}
                    className={cn(
                      "flex h-10 w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none",
                      errors.stationType && "border-destructive",
                    )}
                  >
                    <option value="INTERNAL">Trạm nội bộ</option>
                    <option value="AGENCY">Trạm đối tác</option>
                  </select>
                  <ErrorMsg message={errors.stationType?.message} />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Địa chỉ chi tiết
                  </label>
                  <Input
                    {...register("address")}
                    className={cn(
                      "bg-muted/20",
                      errors.address && "border-destructive",
                    )}
                  />
                  <ErrorMsg message={errors.address?.message} />
                </div>
                <div className="col-span-2 sm:col-span-1 space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Vĩ độ (Latitude)
                  </label>
                  <Input
                    type="number"
                    step="any"
                    {...register("latitude", { valueAsNumber: true })}
                    className={cn(
                      "bg-muted/20 font-mono",
                      errors.latitude && "border-destructive",
                    )}
                  />
                  <ErrorMsg message={errors.latitude?.message} />
                </div>
                <div className="col-span-2 sm:col-span-1 space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Kinh độ (Longitude)
                  </label>
                  <Input
                    type="number"
                    step="any"
                    {...register("longitude", { valueAsNumber: true })}
                    className={cn(
                      "bg-muted/20 font-mono",
                      errors.longitude && "border-destructive",
                    )}
                  />
                  <ErrorMsg message={errors.longitude?.message} />
                </div>
                <div className="col-span-2 sm:col-span-1 space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Tổng sức chứa
                  </label>
                  <Input
                    type="number"
                    {...register("totalCapacity", { valueAsNumber: true })}
                    className={cn(
                      "bg-muted/20 font-mono",
                      errors.totalCapacity && "border-destructive",
                    )}
                  />
                  <ErrorMsg message={errors.totalCapacity?.message} />
                </div>
                <div className="col-span-2 sm:col-span-1 space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Tối đa khách trả
                  </label>
                  <Input
                    type="number"
                    {...register("returnSlotLimit", { valueAsNumber: true })}
                    className={cn(
                      "bg-muted/20 font-mono",
                      errors.returnSlotLimit && "border-destructive",
                    )}
                  />
                  <ErrorMsg message={errors.returnSlotLimit?.message} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-y-6 gap-x-6">
                <Field
                  label="Tên trạm"
                  value={station.name}
                  className="col-span-2 sm:col-span-1"
                />
                <Field
                  label="Loại trạm"
                  value={
                    station.stationType === "INTERNAL"
                      ? "Trạm nội bộ"
                      : "Trạm đối tác"
                  }
                  className="col-span-2 sm:col-span-1"
                />
                <Field
                  label="Địa chỉ"
                  value={station.address}
                  className="col-span-2"
                />
                <Field
                  label="Tọa độ (Lat, Lng)"
                  value={`${station.location.latitude}, ${station.location.longitude}`}
                  className="col-span-2 sm:col-span-1 font-mono"
                />
                {station.agencyId ? (
                  <Field
                    label="Mã đại lý"
                    value={
                      <code className="text-xs text-primary">
                        {station.agencyId}
                      </code>
                    }
                    className="col-span-2 sm:col-span-1"
                  />
                ) : (
                  <Field
                    label="Mã đại lý"
                    value={
                      <span className="text-muted-foreground italic">
                        Không có
                      </span>
                    }
                    className="col-span-2 sm:col-span-1"
                  />
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard icon={Users} title="Nhân viên phụ trách">
            {station.workers?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {station.workers.map((w) => (
                  <div
                    key={w.userId}
                    className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/40 transition-colors"
                  >
                    <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shadow-sm border border-primary/20">
                      {w.fullName.charAt(0)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-bold truncate text-foreground">
                        {w.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ROLE_LABELS[w.role]}
                      </p>
                    </div>
                    {w.technicianTeamId && (
                      <div>
                        <p className="text-sm font-bold truncate text-foreground">
                          {w.fullName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {ROLE_LABELS[w.role]}
                        </p>
                        <Badge
                          variant="secondary"
                          // 1. Thêm max-width và thay whitespace-nowrap bằng truncate
                          className="max-w-[90px] sm:max-w-[120px] truncate text-[10px] bg-background shadow-sm inline-block text-center"
                          // 2. Thêm title để hover xem tên đầy đủ
                          title={`Team ${w.technicianTeamName}`}
                        >
                          Team {w.technicianTeamName}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-border/60 rounded-xl bg-muted/10">
                <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-foreground">
                  Chưa có nhân sự
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Trạm này hiện chưa được phân công cho nhân viên nào.
                </p>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAgencyActions } from "@/hooks/use-agency";
import { useStationActions } from "@/hooks/use-station";
import {
  ArrowLeft,
  Bike,
  Info,
  LayoutGrid,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Ban,
  Clock,
  TrendingUp,
  Repeat,
  Users,
  HelpCircle,
  LucideIcon,
  MapPin,
  RefreshCcw,
  Truck,
  ShieldAlert,
  Wallet,
  CalendarCheck,
  Hammer,
} from "lucide-react";
import { Station } from "@/types";
import { cn } from "@/lib/utils";
import { formatToVNTime } from "@/lib/formatVNDate";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { ROLE_LABELS } from "@/columns/user-columns";

interface StationReport {
  id: string;
  name: string;
  address: string;
  totalRentals: number;
  totalRevenue: number;
  totalDuration: number;
  avgDuration: number;
}

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
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
          bgClass,
        )}
      >
        <Icon className={cn("h-6 w-6", colorClass)} />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="mt-0.5 text-2xl font-bold text-foreground">{value}</h3>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
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
        "rounded-xl border border-border/50 bg-card shadow-sm h-full flex flex-col",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border/30 px-6 py-4">
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
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}
      </p>
      <div className="text-sm font-medium text-foreground">{value}</div>
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
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0 last:pb-0">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "p-1.5 rounded-md bg-muted/50",
            color
              .replace("text-", "text-")
              .replace("500", "500")
              .replace("600", "600"),
          )}
        >
          <Icon className={cn("h-4 w-4", color)} />
        </div>
        <span className="text-sm text-muted-foreground font-medium">
          {label}
        </span>
      </div>
      <span
        className={cn(
          "text-sm",
          boldValue ? "font-bold" : "font-semibold",
          color,
        )}
      >
        {value || 0}
      </span>
    </div>
  );
}

// --- MAIN PAGE ---
export default function StationDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const {
    myStationDetail,
    isLoadingMyStationDetail,
    getMyStationDetail,
    responseStationRevenueForAgency,
    isLoadingStationRevenueForAgency,
    getStationRevenueForAgency,
  } = useAgencyActions({
    hasToken: true,
    station_id: id,
  });

  const { getListStation, listStation } = useStationActions({
    hasToken: true,
    stationId: id,
  });

  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(true);

  // Xử lý loading
  useEffect(() => {
    getListStation();
  }, [getListStation]);

  useEffect(() => {
    if (isLoadingMyStationDetail || isLoadingStationRevenueForAgency) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoadingMyStationDetail, isLoadingStationRevenueForAgency]);

  useEffect(() => {
    if (id) {
      getMyStationDetail();
      getStationRevenueForAgency();
    }
  }, [id, getMyStationDetail, getStationRevenueForAgency]);

  if (isVisualLoading) return <LoadingScreen />;
  if (!myStationDetail) {
    notFound();
  }

  const station = myStationDetail as Station;

  // Trích xuất doanh thu
  const rawRevenueData =
    (responseStationRevenueForAgency as any)?.data ||
    responseStationRevenueForAgency;
  const currentStationRevenue: StationReport | undefined =
    rawRevenueData?.stations?.find((s: StationReport) => s.id === id);

  return (
    <div className="-m-6 min-h-[calc(100vh-5rem)] bg-slate-50/50 p-6 dark:bg-background pb-10">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* HEADER ACTIONS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl flex items-center gap-3">
                Chi tiết trạm
              </h1>
              <span
                className={
                  station.stationType === "INTERNAL"
                    ? "text-blue-600 font-medium text-sm bg-blue-100 px-2 py-0.5 rounded"
                    : "text-purple-600 font-medium text-sm bg-purple-100 px-2 py-0.5 rounded"
                }
              >
                {station.stationType === "INTERNAL"
                  ? "Trạm nội bộ"
                  : "Trạm đối tác"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {myStationDetail?.id !== listStation?.currentStation?.id && (
              <Button
                onClick={() =>
                  router.push(
                    `/agency/distribution-request/create?targetStationId=${station.id}`,
                  )
                }
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Repeat className="w-4 h-4 mr-2" /> Điều phối xe đến trạm này
              </Button>
            )}
            <Button variant="outline" onClick={() => router.back()}>
              Quay lại danh sách
            </Button>
          </div>
        </div>

        {/* METADATA BAR */}
        <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/30 px-5 py-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-1">
          <div>
            <span className="text-muted-foreground font-medium uppercase text-[11px] tracking-wider mr-2">
              ID Trạm:
            </span>
            <span className="font-mono text-sm font-semibold text-foreground">
              {station.id}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground font-medium uppercase text-[11px] tracking-wider mr-2">
              Khởi tạo:
            </span>
            <span className="text-sm font-medium text-foreground">
              {formatToVNTime(station.createdAt)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground font-medium uppercase text-[11px] tracking-wider mr-2">
              Cập nhật:
            </span>
            <span className="text-sm font-medium text-foreground">
              {formatToVNTime(station.updatedAt)}
            </span>
          </div>
        </div>

        {/* TOP METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {myStationDetail?.id === listStation?.currentStation?.id && (
            <MetricCard
              title="Tổng doanh thu"
              value={
                currentStationRevenue
                  ? new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(currentStationRevenue.totalRevenue)
                  : "0 ₫"
              }
              icon={Wallet}
              colorClass="text-emerald-600 dark:text-emerald-400"
              bgClass="bg-emerald-100 dark:bg-emerald-500/10"
            />
          )}
          <MetricCard
            title="Tổng lượt thuê"
            value={currentStationRevenue?.totalRentals || 0}
            subtitle={
              currentStationRevenue
                ? `TB: ${Math.round(currentStationRevenue.avgDuration)} phút/lượt`
                : ""
            }
            icon={CalendarCheck}
            colorClass="text-blue-600 dark:text-blue-400"
            bgClass="bg-blue-100 dark:bg-blue-500/10"
          />
          <MetricCard
            title="Tổng vị trí bãi đỗ"
            value={station.capacity.total}
            subtitle={`Còn trống: ${station.capacity.emptyPhysicalSlots ?? station.returnSlots?.available ?? 0} chỗ`}
            icon={LayoutGrid}
            colorClass="text-indigo-600 dark:text-indigo-400"
            bgClass="bg-indigo-100 dark:bg-indigo-500/10"
          />
          <MetricCard
            title="Xe thực tế tại trạm"
            value={station.bikes.total || station.capacity.totalInStationBikes}
            subtitle={`Sẵn sàng: ${station.bikes.available} xe`}
            icon={Bike}
            colorClass="text-amber-600 dark:text-amber-400"
            bgClass="bg-amber-100 dark:bg-amber-500/10"
          />
        </div>

        {/* MIDDLE CONTENT GRID (2 Trái - 1 Phải) */}
        <div className="grid gap-6 lg:grid-cols-3 items-start">
          {/* CỘT TRÁI (Thông tin chung & Nhân sự) */}
          <div className="lg:col-span-2 space-y-6">
            <SectionCard icon={Info} title="Thông tin quản lý">
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <Field label="Tên trạm" value={station.name} />
                {
                  station.stationType === "AGENCY" && (<Field label="Loại trạm" value={"Đại lý"} />)
                }
                {
                  station.stationType === "INTERNAL" && (<Field label="Loại trạm" value={"Nội bộ"} />)
                }
                <Field
                  label="Địa chỉ"
                  value={station.address}
                  className="col-span-2"
                />
                <Field
                  label="Tọa độ GPS"
                  value={
                    station.location.latitude
                      ? `${station.location.latitude}, ${station.location.longitude}`
                      : "N/A"
                  }
                  className="col-span-2 sm:col-span-1"
                />
                {station.agencyId && (
                  <Field
                    label="Mã đại lý"
                    value={
                      <code className="text-xs bg-muted p-1.5 rounded-md border border-border/50">
                        {station.agencyId}
                      </code>
                    }
                    className="col-span-2 sm:col-span-1"
                  />
                )}
              </div>
            </SectionCard>

            <SectionCard icon={Users} title="Nhân viên phụ trách">
              {station.workers && station.workers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {station.workers.map((w) => (
                    <div
                      key={w.userId}
                      className="flex items-center gap-3 p-3.5 rounded-xl border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shadow-sm">
                        {w.fullName.charAt(0)}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold truncate">
                          {w.fullName}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                          {ROLE_LABELS[w.role]}
                        </p>
                      </div>
                      {w.technicianTeamId && (
                        <Badge
                          variant="outline"
                          className="text-[10px] whitespace-nowrap bg-background"
                        >
                          Team {w.technicianTeamName}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center border-2 border-dashed border-border/50 rounded-xl">
                  <Users className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Chưa có nhân viên nào được phân công.
                  </p>
                </div>
              )}
            </SectionCard>
          </div>

          {/* CỘT PHẢI (Sức chứa & Doanh thu) */}
          <div className="lg:col-span-1 space-y-6">
            <SectionCard icon={LayoutGrid} title="Quản lý chỗ đỗ">
              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border/50">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Chỗ trống thực tế
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {station.capacity.emptyPhysicalSlots ??
                        station.returnSlots?.available ??
                        0}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        / {station.capacity.total}
                      </span>
                    </p>
                  </div>
                  <LayoutGrid className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <div className="space-y-1 px-1">
                  <StatusItem
                    icon={Activity}
                    label="Chỗ khách trả xe"
                    value={station.returnSlots?.active || 0}
                    color="text-blue-600"
                  />
                  <StatusItem
                    icon={Wrench}
                    label="Chỗ xe điều phối"
                    value={station.redistributionSlots || 0}
                    color="text-orange-500"
                  />
                  
                </div>
              </div>
            </SectionCard>
            {myStationDetail?.id === listStation?.currentStation?.id && (
              <SectionCard icon={TrendingUp} title="Báo cáo nhanh">
                {currentStationRevenue ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-5 text-center">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Tổng doanh thu
                      </p>
                      <p className="mt-1 text-3xl font-bold text-green-600 dark:text-green-500">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(currentStationRevenue.totalRevenue)}
                      </p>
                    </div>
                    <div className="flex justify-between items-center px-2">
                      <span className="text-sm text-muted-foreground">
                        Tổng lượt thuê:
                      </span>
                      <span className="text-sm font-bold">
                        {currentStationRevenue.totalRentals} lượt
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-2">
                      <span className="text-sm text-muted-foreground">
                        Thời gian thuê TB:
                      </span>
                      <span className="text-sm font-bold">
                        {Math.round(currentStationRevenue.avgDuration)} phút
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Không có dữ liệu doanh thu.
                  </div>
                )}
              </SectionCard>
            )}
          </div>
        </div>

        {/* BOTTOM SECTION - TRẠNG THÁI PHƯƠNG TIỆN */}
        <SectionCard
          icon={Activity}
          title="Chi tiết trạng thái phương tiện"
          className="w-full"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:divide-x divide-y md:divide-y-0 divide-border/40">
            {/* Cột 1: Xe nội trạm */}
            <div className="pt-4 md:pt-0 first:pt-0 md:pr-4">
              <h4 className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-4">
                <MapPin className="h-3.5 w-3.5" /> Xe nội trạm
              </h4>
              <div className="space-y-1">
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
                  color="text-red-500"
                />
              </div>
            </div>

            {/* Cột 2: Xe ngoại trạm */}
            <div className="pt-6 md:pt-0 md:px-4">
              <h4 className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-4">
                <RefreshCcw className="h-3.5 w-3.5" /> Xe ngoại trạm
              </h4>
              <div className="space-y-1">
                <StatusItem
                  icon={RefreshCcw}
                  label="Hỗ trợ sự cố (Swapping)"
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
                  label="Đang thuê (Booked)"
                  value={station.bikes.booked}
                  color="text-indigo-500"
                />
              </div>
            </div>

            {/* Cột 3: Xe ngưng hoạt động */}
            <div className="pt-6 md:pt-0 md:pl-4">
              <h4 className="flex items-center gap-2 text-[11px] font-bold text-destructive uppercase tracking-wider mb-4">
                <ShieldAlert className="h-3.5 w-3.5" /> Xe ngưng hoạt động
              </h4>
              <div className="space-y-1">
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
  );
}

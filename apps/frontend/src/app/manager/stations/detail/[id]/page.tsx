"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  Users, // Thêm icon
  HelpCircle // Thêm icon
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Station } from "@/types";
import { cn } from "@/lib/utils";
import { formatToVNTime } from "@/lib/formatVNDate";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
        "overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border/60 px-5 py-4">
        <Icon className="h-5 w-5 shrink-0 text-primary" />
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
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
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

// --- MAIN PAGE ---

export default function StationDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const {
    getMyStationDetail,
    myStationDetail,
    isLoadingMyStationDetail,
    getStationRevenueForManager,
    responseStationRevenueForManager,
    isLoadingStationRevenueForManager,
  } = useStationActions({
    hasToken: true,
    stationId: id,
  });

  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(true);

  // Xử lý loading visual chung
  useEffect(() => {
    if (isLoadingMyStationDetail || isLoadingStationRevenueForManager) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoadingMyStationDetail, isLoadingStationRevenueForManager]);

  // Fetch data detail và data doanh thu
  useEffect(() => {
    if (id) {
      getMyStationDetail();
      getStationRevenueForManager(); // Gọi fetch doanh thu
    }
  }, [id, getMyStationDetail, getStationRevenueForManager]);

  if (isVisualLoading) return <LoadingScreen />;
  if (!myStationDetail) {
    notFound();
  }

  const station = myStationDetail as Station;

  // Trích xuất doanh thu của trạm hiện tại từ response
  const rawRevenueData =
    (responseStationRevenueForManager as any)?.data ||
    responseStationRevenueForManager;
  const currentStationRevenue: StationReport | undefined =
    rawRevenueData?.stations?.find((s: StationReport) => s.id === id);

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
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl flex items-center gap-3">
              Chi tiết trạm
              <Badge variant={station.stationType === "AGENCY" ? "default" : "secondary"} className="text-sm">
                {station.stationType === "INTERNAL" ? "Trạm nội bộ" : "Trạm đối tác"}
              </Badge>
            </h1>
          </div>

          <Button
            variant="outline"
            onClick={() => router.push("/manager/stations")}
          >
            Quay lại danh sách
          </Button>
        </div>

        {/* Metadata Bar */}
        <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-1">
          <div>
            <span className="text-muted-foreground">ID Trạm: </span>
            <span className="font-mono text-xs text-foreground">
              {station.id}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Khởi tạo: </span>
            <span className="text-foreground">
              {formatToVNTime(station.createdAt)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Cập nhật: </span>
            <span className="text-foreground">
              {formatToVNTime(station.updatedAt)}
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column: Info, Workers & Capacity */}
          <div className="space-y-6 lg:col-span-2">
            <SectionCard icon={Info} title="Thông tin quản lý">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                <Field label="Tên trạm" value={station.name} />
                <Field label="Loại trạm" value={station.stationType} />
                
                <Field
                  label="Tọa độ GPS"
                  value={
                    station.location.latitude
                      ? `${station.location.latitude}, ${station.location.longitude}`
                      : "N/A"
                  }
                />
                {station.agencyId && (
                  <Field label="Mã đại lý" value={<code className="text-xs bg-muted p-1 rounded">{station.agencyId}</code>} />
                )}

                <Field
                  label="Địa chỉ"
                  value={station.address}
                  className="md:col-span-2"
                />
              </div>
            </SectionCard>

            <SectionCard icon={Users} title="Nhân viên phụ trách">
              {station.workers && station.workers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {station.workers.map((w) => (
                    <div key={w.userId} className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border/40">
                      <div className="flex gap-3 items-center">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {w.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{w.fullName}</p>
                          <p className="text-[10px] text-muted-foreground">{ROLE_LABELS[w.role]}</p>
                        </div>
                      </div>
                      {w.technicianTeamId && (
                        <div className="mt-1">
                          <Badge variant="secondary" className="text-[10px] font-normal">{w.technicianTeamName}</Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Không có nhân viên phụ trách trạm này.</p>
              )}
            </SectionCard>

            <SectionCard icon={LayoutGrid} title="Cấu hình sức chứa">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-lg bg-muted p-3 text-center border border-border/40">
                  <p className="text-[10px] text-muted-foreground font-bold">Tổng vị trí</p>
                  <p className="text-xl font-bold text-foreground">{station.capacity.total}</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3 text-center border-border/40 border">
                  <p className="text-[10px] text-secondary-foreground font-bold">Trả xe tối đa</p>
                  <p className="text-xl font-bold text-foreground">{station.capacity.returnSlotLimit}</p>
                </div>
                <div className="rounded-lg bg-muted p-3 text-center">
                  <p className="text-[10px] text-muted-foreground font-bold">Chỗ còn trống</p>
                  <p className="text-xl font-extrabold text-foreground">{station.capacity.emptyPhysicalSlots}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3 text-center">
                  <p className="text-[10px] text-primary font-bold">Chỗ đã đặt</p>
                  <p className="text-xl font-bold text-primary">{station.capacity.totalActiveSlots}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border/40 space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Chi tiết chỗ trả</p>
                <StatusItem icon={Activity} label="Chỗ trả xe" value={station.returnSlots?.active || 0} color="text-blue-600" />
                <StatusItem icon={Wrench} label="Điều phối" value={station.redistributionSlots || 0} color="text-orange-500" />
              </div>
            </SectionCard>
          </div>

          {/* Right Column: Revenue & Bike Statistics */}
          <div className="space-y-6">
            <SectionCard icon={TrendingUp} title="Báo cáo doanh thu">
              {currentStationRevenue ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-green-500/15 bg-green-500/5 px-4 py-5 text-center">
                    <p className="text-xs font-medium text-muted-foreground">
                      Tổng doanh thu
                    </p>
                    <p className="mt-1 text-3xl font-bold text-green-600">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(currentStationRevenue.totalRevenue)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="rounded-lg border border-border/40 bg-muted/20 p-3 text-center">
                      <p className="text-[10px] text-muted-foreground font-bold">
                        Lượt thuê
                      </p>
                      <p className="text-lg font-bold text-foreground">
                        {currentStationRevenue.totalRentals}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/40 bg-muted/20 p-3 text-center">
                      <p className="text-[10px] text-muted-foreground font-bold">
                        Thời gian TB
                      </p>
                      <p className="text-lg font-bold text-foreground">
                        {Math.round(currentStationRevenue.avgDuration)} phút
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Không có dữ liệu doanh thu cho trạm này.
                </div>
              )}
            </SectionCard>

            <SectionCard icon={Activity} title="Thống kê xe tại trạm">
              <div className="space-y-4">
                <div className="rounded-lg border border-primary/15 bg-primary/5 px-4 py-5 text-center">
                  <p className="text-xs font-medium text-muted-foreground">
                    Tổng số xe hiện có
                  </p>
                  <p className="mt-1 text-4xl font-bold text-primary">
                    {station.bikes.total}
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <StatusItem
                    icon={CheckCircle2}
                    label="Sẵn sàng"
                    value={station.bikes.available}
                    color="text-green-600"
                  />
                  <StatusItem
                    icon={Clock}
                    label="Đang đặt trước"
                    value={station.bikes.reserved}
                    color="text-amber-600"
                  />
                  <StatusItem
                    icon={Bike}
                    label="Đang thuê"
                    value={station.bikes.booked}
                    color="text-blue-600"
                  />
                  <StatusItem
                    icon={Wrench}
                    label="Chuẩn bị điều phối"
                    value={station.bikes.redistributing}
                    color="text-orange-500"
                  />
                  <StatusItem
                    icon={AlertTriangle}
                    label="Xe hỏng"
                    value={station.bikes.broken}
                    color="text-red-500"
                  />
                  <StatusItem 
                    icon={HelpCircle} 
                    label="Xe bị mất" 
                    value={station.bikes.lost} 
                    color="text-red-700 font-bold" 
                  />
                  <StatusItem
                    icon={Ban}
                    label="Xe tạm ngưng hoạt động"
                    value={station.bikes.disabled}
                    color="text-muted-foreground"
                  />
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---

function StatusItem({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm py-1 border-b border-border/40 last:border-0 last:pb-0">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", color)} />
        <span className="text-muted-foreground">{label}</span>
      </div>
      <span className={cn("font-bold", color)}>{value}</span>
    </div>
  );
}
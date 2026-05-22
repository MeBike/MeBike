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
  PieChart,
  History,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ClipboardList
} from "lucide-react";
import { Station } from "@/types";
import { cn } from "@/lib/utils";
import { formatToVNTime } from "@/lib/formatVNDate";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { ROLE_LABELS } from "@/columns/user-columns";
import { StationLayoutMap } from "@/components/StationLayoutMap";
import type { RedistributionRequest } from "@/types/DistributionRequest";
import { useDistributionRequest } from "@/hooks/use-distribution-request";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-background p-6 shadow-sm transition-all hover:shadow-md hover:border-border/80 group">
      <div className={cn("absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-50 blur-2xl transition-all group-hover:scale-110", bgClass)} />
      
      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex flex-col">
            <span className="text-3xl font-bold tracking-tight text-foreground">{value}</span>
            {subtitle && <span className="mt-1 text-xs font-medium text-muted-foreground">{subtitle}</span>}
          </div>
        </div>
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", bgClass)}>
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
    <div className={cn("rounded-2xl border border-border/50 bg-background shadow-sm flex flex-col overflow-hidden", className)}>
      <div className="flex items-center gap-2 border-b border-border/40 px-6 py-4 bg-muted/20">
        <Icon className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-6 flex-1">{children}</div>
    </div>
  );
}

function Field({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</p>
      <div className="text-sm font-medium text-foreground bg-muted/20 px-3 py-2 rounded-lg border border-border/40">{value}</div>
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
  const bgColor = color.replace("text-", "bg-").concat("/10");
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-border/30 hover:bg-muted/20 transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", bgColor)}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
        <span className="text-sm font-medium text-foreground/80">{label}</span>
      </div>
      <Badge variant="outline" className={cn("px-2.5 py-0.5 text-sm", boldValue ? "font-bold" : "font-semibold", color, bgColor, "border-transparent")}>
        {value || 0}
      </Badge>
    </div>
  );
}

// --- HELPER FOR HISTORY BADGES ---
function getRedistributionStatusConfig(status: string) {
  switch (status) {
    case "PENDING":
      return { label: "Chờ phê duyệt", color: "bg-amber-100 text-amber-800 border-amber-200" };
    case "APPROVED":
      return { label: "Đã phê duyệt", color: "bg-blue-100 text-blue-800 border-blue-200" };
    case "IN_TRANSIT":
      return { label: "Đang vận chuyển", color: "bg-purple-100 text-purple-800 border-purple-200" };
    case "COMPLETED":
      return { label: "Đã hoàn thành", color: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    case "CANCELLED":
      return { label: "Đã hủy", color: "bg-red-100 text-red-800 border-red-200" };
    case "REJECTED":
      return { label: "Từ chối", color: "bg-red-100 text-red-800 border-red-200" };
    default:
      return { label: status, color: "bg-gray-100 text-gray-800 border-gray-200" };
  }
}

// --- MAIN PAGE ---
export default function StationDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_PAGE_SIZE = 5;

  const {
    getMyStationDetail,
    myStationDetail,
    isLoadingMyStationDetail,
    getStationRevenueForManager,
    responseStationRevenueForManager,
    isLoadingStationRevenueForManager,
    listStation,
    getListStation,
  } = useStationActions({
    hasToken: true,
    stationId: id,
  });

  const {
    managerViewDistributionRequestHistory,
    isFetchingManagerViewDistributionRequestHistory,
    getManagerViewHistoryDistribution,
  } = useDistributionRequest({ 
    hasToken: true, 
    targetStationId: id, // Truyền id trạm để lọc
    page: historyPage,
    pageSize: HISTORY_PAGE_SIZE
  });

  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(true);

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

  useEffect(() => {
    getListStation();
    if (id) {
      getMyStationDetail();
      getStationRevenueForManager();
    }
  }, [id, getMyStationDetail, getStationRevenueForManager, getListStation]);

  useEffect(() => {
    if (id) {
      getManagerViewHistoryDistribution();
    }
  }, [id, historyPage, getManagerViewHistoryDistribution]);

  if (isVisualLoading) return <LoadingScreen />;
  if (!myStationDetail) {
    notFound();
  }

  const station = myStationDetail as Station;
  const isOwnStation = station.id === listStation?.currentStation?.id;

  const rawRevenueData =
    (responseStationRevenueForManager as any)?.data ||
    responseStationRevenueForManager;
  const currentStationRevenue: StationReport | undefined =
    rawRevenueData?.stations?.find((s: StationReport) => s.id === id);

  // Xử lý dữ liệu history an toàn
  const historyDataResponse = managerViewDistributionRequestHistory?.data as any;
  const historyItems: RedistributionRequest[] = historyDataResponse?.data || [];
  const totalHistoryPages = historyDataResponse?.meta?.pageCount || 1;

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
                onClick={() => router.back()}
                className="h-10 w-10 rounded-full bg-white dark:bg-card hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Chi tiết trạm
                  </h1>
                  <Badge variant={station.stationType === "INTERNAL" ? "default" : "secondary"} className="rounded-full px-3 shadow-sm">
                    {station.stationType === "INTERNAL" ? "Trạm nội bộ" : "Trạm đối tác"}
                  </Badge>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              className="shadow-sm rounded-full"
              onClick={() => router.push("/manager/stations")}
            >
              Quay lại danh sách
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-1.5"><Badge variant="outline" className="font-mono bg-white dark:bg-card">ID: {station.id}</Badge></div>
            <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Khởi tạo: {formatToVNTime(station.createdAt)}</div>
            <div className="flex items-center gap-1.5"><RefreshCcw className="w-3.5 h-3.5"/> Cập nhật: {formatToVNTime(station.updatedAt)}</div>
          </div>
        </div>

        {/* TẦNG 1: TOP METRICS */}
        <div
          className={cn(
            "grid grid-cols-1 gap-5 sm:grid-cols-2",
            isOwnStation ? "lg:grid-cols-4" : "lg:grid-cols-2"
          )}
        >
          {isOwnStation && (
            <>
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
                bgClass="bg-emerald-100 dark:bg-emerald-500/20"
              />
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
                bgClass="bg-blue-100 dark:bg-blue-500/20"
              />
            </>
          )}
          <MetricCard
            title="Tổng vị trí bãi đỗ"
            value={station.capacity.total}
            subtitle={`Trả tối đa: ${station.capacity.returnSlotLimit} chỗ`}
            icon={LayoutGrid}
            colorClass="text-indigo-600 dark:text-indigo-400"
            bgClass="bg-indigo-100 dark:bg-indigo-500/20"
          />
          <MetricCard
            title="Xe thực tế tại trạm"
            value={station.capacity.totalInStationBikes ?? station.bikes.total}
            subtitle={`Sẵn sàng: ${station.bikes.available} xe`}
            icon={Bike}
            colorClass="text-amber-600 dark:text-amber-400"
            bgClass="bg-amber-100 dark:bg-amber-500/20"
          />
        </div>

        {/* TẦNG 2: BẢN ĐỒ 2D VÀ CHI TIẾT TRẠNG THÁI */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          <div className="xl:col-span-2">
              <StationLayoutMap station={station} />
          </div>

          <div className="xl:col-span-1">
            <SectionCard icon={PieChart} title="Phân bổ không gian bãi đỗ" className="h-full">
              <div className="flex flex-col items-center justify-center py-4 mb-6 bg-muted/20 rounded-xl border border-border/40">
                <p className="text-sm font-medium text-muted-foreground mb-1">Chỗ trống hiện tại</p>
                <p className="text-4xl font-black text-foreground">
                  {station.capacity.emptyPhysicalSlots ?? station.returnSlots?.available ?? 0} <span className="text-lg font-medium text-muted-foreground">/ {station.capacity.total}</span>
                </p>
              </div>
              <div className="space-y-3">
                <StatusItem icon={Activity} label="Chỗ chờ khách trả xe" value={station.returnSlots?.active || 0} color="text-blue-600" />
                <StatusItem icon={Wrench} label="Chỗ chờ xe điều phối" value={station.redistributionSlots || 0} color="text-orange-500" />
              </div>
            </SectionCard>
          </div>

          <div className="xl:col-span-3">
            <SectionCard icon={Activity} title="Chi tiết trạng thái phương tiện" className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-muted/10 rounded-xl p-5 border border-border/30">
                  <h4 className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 pb-2 border-b border-border/40">
                    <MapPin className="h-4 w-4" /> Xe nội trạm
                  </h4>
                  <div className="space-y-2.5">
                    <StatusItem icon={CheckCircle2} label="Sẵn sàng cho thuê" value={station.bikes.available} color="text-emerald-600" boldValue />
                    <StatusItem icon={Clock} label="Đã đặt trước" value={station.bikes.reserved} color="text-amber-600" />
                    <StatusItem icon={Wrench} label="Chuẩn bị điều phối" value={station.bikes.pendingDispatch} color="text-orange-500" />
                    <StatusItem icon={AlertTriangle} label="Đang bị hỏng" value={station.bikes.broken} color="text-red-500" />
                    <StatusItem icon={Hammer} label="Đã sửa" value={station.bikes.fixed} color="text-indigo-500" />
                  </div>
                </div>

                <div className="bg-muted/10 rounded-xl p-5 border border-border/30">
                  <h4 className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 pb-2 border-b border-border/40">
                    <RefreshCcw className="h-4 w-4" /> Xe luân chuyển
                  </h4>
                  <div className="space-y-2.5">
                    <StatusItem icon={RefreshCcw} label="Hỗ trợ sự cố" value={station.bikes.swapping} color="text-blue-500" />
                    <StatusItem icon={Truck} label="Đang vận chuyển" value={station.bikes.transporting} color="text-indigo-500" />
                    <StatusItem icon={Bike} label="Đang thuê" value={station.bikes.booked} color="text-blue-600" />
                  </div>
                </div>

                <div className="bg-red-50/50 dark:bg-red-950/10 rounded-xl p-5 border border-red-100 dark:border-red-900/30">
                  <h4 className="flex items-center gap-2 text-xs font-bold text-destructive uppercase tracking-wider mb-4 pb-2 border-b border-red-100 dark:border-red-900/30">
                    <ShieldAlert className="h-4 w-4" /> Sự cố / Mất mát
                  </h4>
                  <div className="space-y-2.5">
                    <StatusItem icon={HelpCircle} label="Bị mất" value={station.bikes.lost} color="text-red-600" />
                    <StatusItem icon={Ban} label="Tạm ngưng hệ thống" value={station.bikes.disabled} color="text-slate-500" />
                  </div>
                </div>

              </div>
            </SectionCard>
          </div>
        </div>

        {/* TẦNG 3: THÔNG TIN CƠ BẢN VÀ NHÂN SỰ */}
        <div className="grid gap-6 lg:grid-cols-2">
          
          <SectionCard icon={Info} title="Thông tin cơ bản">
            <div className="grid grid-cols-2 gap-y-6 gap-x-6">
              <Field label="Tên trạm" value={station.name} className="col-span-2 sm:col-span-1" />
              <Field label="Loại trạm" value={station.stationType === "INTERNAL" ? "Trạm nội bộ" : "Trạm đối tác"} className="col-span-2 sm:col-span-1" />
              <Field label="Địa chỉ" value={station.address} className="col-span-2" />
              <Field label="Tọa độ (Lat, Lng)" value={station.location.latitude ? `${station.location.latitude}, ${station.location.longitude}` : "N/A"} className="col-span-2 sm:col-span-1 font-mono" />
              {station.agencyId ? (
                <Field
                  label="Mã đại lý"
                  value={<code className="text-xs text-primary">{station.agencyId}</code>}
                  className="col-span-2 sm:col-span-1"
                />
              ) : (
                <Field label="Mã đại lý" value={<span className="text-muted-foreground italic">Không có</span>} className="col-span-2 sm:col-span-1" />
              )}
            </div>
          </SectionCard>

          <div className="space-y-6">
            <SectionCard icon={Users} title="Nhân viên phụ trách">
              {station.workers?.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {station.workers.map((w) => (
                    <div key={w.userId} className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/40 transition-colors">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shadow-sm border border-primary/20">
                        {w.fullName.charAt(0)}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold truncate text-foreground">{w.fullName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{ROLE_LABELS[w.role]}</p>
                      </div>
                      {w.technicianTeamId && (
                        <Badge 
                          variant="secondary" 
                          className="max-w-[90px] sm:max-w-[120px] truncate text-[10px] bg-background shadow-sm inline-block text-center"
                          title={`Team ${w.technicianTeamName}`}
                        >
                          Team {w.technicianTeamName}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 px-4 text-center border-2 border-dashed border-border/60 rounded-xl bg-muted/10">
                  <Users className="h-8 w-8 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-foreground">Chưa có nhân sự</p>
                </div>
              )}
            </SectionCard>

            {/* BÁO CÁO NHANH CHO QUẢN LÝ (Chỉ hiện khi là trạm của họ) */}
            {isOwnStation && (
              <SectionCard icon={TrendingUp} title="Báo cáo nhanh">
                {currentStationRevenue ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-5 text-center">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Tổng doanh thu
                      </p>
                      <p className="mt-1 text-3xl font-bold text-green-600 dark:text-green-500">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(currentStationRevenue.totalRevenue)}
                      </p>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/20 border border-border/30">
                      <span className="text-sm text-muted-foreground font-medium">Tổng lượt thuê:</span>
                      <span className="text-sm font-bold">{currentStationRevenue.totalRentals} lượt</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/20 border border-border/30">
                      <span className="text-sm text-muted-foreground font-medium">Thời gian thuê TB:</span>
                      <span className="text-sm font-bold">{Math.round(currentStationRevenue.avgDuration)} phút</span>
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

        {/* TẦNG 4: LỊCH SỬ ĐIỀU PHỐI ĐẾN TRẠM */}
        <SectionCard icon={History} title="Lịch sử điều phối xe đến trạm">
          {isFetchingManagerViewDistributionRequestHistory ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col gap-3 p-5 rounded-xl border border-border/40 bg-muted/5">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : historyItems.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {historyItems.map((req) => {
                  const statusConf = getRedistributionStatusConfig(req.status);
                  return (
                    <div 
                      key={req.id} 
                      className="group flex flex-col md:flex-row gap-4 justify-between items-start md:items-center p-5 rounded-xl border border-border/50 bg-card hover:bg-muted/30 hover:border-primary/30 transition-all duration-300 hover:shadow-sm"
                    >
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-mono text-sm font-bold text-foreground">
                            #{req.id.slice(0, 8).toUpperCase()}
                          </span>
                          <Badge className={cn("border bg-transparent shadow-none px-2.5 py-0.5", statusConf.color)}>
                            {statusConf.label}
                          </Badge>
                          <div className="flex items-center text-xs text-muted-foreground ml-auto md:ml-0 font-medium">
                            <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                            {formatToVNTime(req.createdAt)}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                          <div className="flex items-center text-foreground font-medium bg-muted/40 px-3 py-1.5 rounded-md border border-border/50">
                            <span className="text-muted-foreground mr-2 font-normal">Từ:</span>
                            {
                              listStation?.currentStation.id === req.sourceStation.id ? (
                                <span className="text-blue-600 font-semibold">Từ trạm của tôi</span>
                              ) : (
                                req.sourceStation?.name || "N/A"
                              )
                            }
                            <ArrowRight className="h-3.5 w-3.5 mx-2 text-primary" /> 
                            {
                              listStation?.currentStation.id === req.targetStation.id ? (
                                <span className="text-blue-600 font-semibold">Đến trạm của tôi</span>
                              ) : (
                                req.targetStation?.name || "N/A"
                              )
                            }
                          </div>
                          
                          <div className="flex items-center gap-1.5 font-medium text-foreground">
                            <Bike className="h-4 w-4 text-muted-foreground" />
                            Số lượng: <span className="text-primary font-bold">{req.requestedQuantity} xe</span>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground flex items-start gap-2">
                          <ClipboardList className="h-4 w-4 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">Lý do: {req.reason || "Không có ghi chú"}</span>
                        </p>
                      </div>

                      <div className="flex flex-row md:flex-col items-center gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-none border-border/40">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="w-full md:w-auto shadow-sm hover:bg-primary hover:text-primary-foreground group-hover:scale-105 transition-all"
                          onClick={() => router.push(`/manager/distribution-request/detail/${req.id}`)}
                        >
                          Xem chi tiết <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalHistoryPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/40 pt-5 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Trang <span className="font-bold text-foreground">{historyPage}</span> / {totalHistoryPages}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={historyPage === 1}
                      onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Trước
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={historyPage >= totalHistoryPages}
                      onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                    >
                      Sau <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border/60 rounded-xl bg-muted/10">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <History className="h-6 w-6 text-primary" />
              </div>
              <p className="text-base font-semibold text-foreground">Không có lịch sử điều phối</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Trạm này chưa có bất kỳ yêu cầu điều phối xe nào được ghi nhận trên hệ thống.
              </p>
            </div>
          )}
        </SectionCard>

      </div>
    </div>
  );
}
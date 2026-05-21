"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useStationActions } from "@/hooks/use-station";
import {
  ArrowLeft,
  Bike,
  Info,
  MapPin,
  Clock,
  LayoutGrid,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Ban,
  Repeat,
  Users,
  HelpCircle,
  LucideIcon,
  ShieldAlert,
  RefreshCcw,
  Truck,
  Hammer,
  PieChart,
} from "lucide-react";
import { Station } from "@/types";
import { cn } from "@/lib/utils";
import { formatToVNTime } from "@/lib/formatVNDate";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { ROLE_LABELS } from "@/columns/user-columns";
import { StationLayoutMap } from "@/components/StationLayoutMap";

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
      <Badge variant="outline" className={cn("px-2.5 py-0.5 text-sm", boldValue ? "font-bold" : "font-semibold", color, bgColor, "border-transparent")}>
        {value || 0}
      </Badge>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function StationDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { getMyStationDetail, myStationDetail, isLoadingMyStationDetail, getListStation, listStation } =
    useStationActions({
      hasToken: true,
      stationId: id,
    });

  const [isVisualLoading, setIsVisualLoading] = useState(true);

  useEffect(() => { getListStation() }, [getListStation]);

  useEffect(() => {
    if (isLoadingMyStationDetail) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoadingMyStationDetail]);

  useEffect(() => {
    if (id) {
      getMyStationDetail();
    }
  }, [id, getMyStationDetail]);

  if (isVisualLoading) return <LoadingScreen />;
  if (!myStationDetail) {
    notFound();
  }

  const station = myStationDetail as Station;

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

            <div className="flex flex-wrap items-center gap-2">
              {station.id !== listStation?.currentStation?.id && (
                <Button
                  onClick={() =>
                    router.push(`/technician/distribution-request/create?targetStationId=${station.id}`)
                  }
                  className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm rounded-full"
                >
                  <Repeat className="w-4 h-4 mr-2" /> Điều phối xe đến trạm này
                </Button>
              )}
              <Button variant="outline" className="shadow-sm rounded-full" onClick={() => router.push("/technician/stations")}>
                Quay lại danh sách
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-1.5"><Badge variant="outline" className="font-mono bg-white dark:bg-card">ID: {station.id}</Badge></div>
            <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Khởi tạo: {formatToVNTime(station.createdAt)}</div>
            <div className="flex items-center gap-1.5"><RefreshCcw className="w-3.5 h-3.5"/> Cập nhật: {formatToVNTime(station.updatedAt)}</div>
          </div>
        </div>

        {/* TẦNG 1: 3 CỘT METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <MetricCard
            title="Tổng vị trí bãi đỗ"
            value={station.capacity.total}
            subtitle={`Trả tối đa: ${station.capacity.returnSlotLimit} chỗ`}
            icon={LayoutGrid}
            colorClass="text-indigo-600 dark:text-indigo-400"
            bgClass="bg-indigo-100 dark:bg-indigo-500/20"
          />
          <MetricCard
            title="Chỗ đỗ còn trống"
            value={station.capacity.emptyPhysicalSlots ?? station.returnSlots?.available ?? 0}
            subtitle={`Chỗ đã đặt: ${station.capacity.totalActiveSlots}`}
            icon={Activity}
            colorClass="text-emerald-600 dark:text-emerald-400"
            bgClass="bg-emerald-100 dark:bg-emerald-500/20"
          />
          <MetricCard
            title="Xe thực tế tại trạm"
            value={station.bikes.total || station.capacity.totalInStationBikes}
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

          {/* Chi tiết xe chiếm full width ở dưới */}
          <div className="xl:col-span-3">
            <SectionCard icon={Activity} title="Chi tiết trạng thái phương tiện" className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Nhóm 1 */}
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

                {/* Nhóm 2 */}
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

                {/* Nhóm 3 */}
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
                <p className="text-xs text-muted-foreground mt-1">Trạm này hiện chưa được phân công cho nhân viên nào.</p>
              </div>
            )}
          </SectionCard>

        </div>

      </div>
    </div>
  );
}
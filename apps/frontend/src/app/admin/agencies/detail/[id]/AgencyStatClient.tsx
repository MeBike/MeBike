"use client";

import {
  Users,
  MapPin,
  TrendingUp,
  AlertTriangle,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Bike,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatToVNTime } from "@/lib/formatVNDate";
import { AgencyStats } from "@/types/Agency";

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
    <div className={cn("overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm", className)}>
      <div className="flex items-center gap-2 border-b border-border/60 px-5 py-4">
        <Icon className="h-5 w-5 shrink-0 text-primary" />
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function StatRow({ label, value, subValue }: { label: string; value: React.ReactNode; subValue?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 pb-3 last:border-0 last:pb-0">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        {subValue && <p className="text-[10px] text-muted-foreground/70 uppercase">{subValue}</p>}
      </div>
      <div className="text-sm font-bold text-foreground">{value}</div>
    </div>
  );
}

export function AgencyStatsView({ stats }: { stats: AgencyStats | null }) {
  if (!stats) return null;

  const { currentStation, pickups, operators, incidents, period } = stats;

  return (
    <div className="space-y-6">
      {/* Header Info & Period */}
      <div className="flex flex-col gap-4 rounded-xl border border-primary/20 bg-primary/5 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{stats.agency.name}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Kỳ báo cáo: {formatToVNTime(period.from)} - {formatToVNTime(period.to)}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-background">
            Cập nhật: {formatToVNTime(stats.updatedAt)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Nhân sự */}
        <SectionCard icon={Users} title="Vận hành">
          <div className="space-y-4">
            <StatRow label="Tổng nhân viên" value={operators.totalOperators} />
            <StatRow 
              label="Đang hoạt động" 
              value={<span className="text-green-600">{operators.activeOperators}</span>} 
            />
          </div>
        </SectionCard>

        {/* Trạm xe */}
        <SectionCard icon={MapPin} title="Trạng thái trạm">
          <div className="space-y-4">
            <StatRow label="Sức chứa" value={currentStation.totalCapacity} />
            <StatRow 
              label="Tỉ lệ lấp đầy" 
              value={`${(currentStation.occupancyRate * 100).toFixed(1)}%`} 
            />
            <StatRow label="Ô trống" value={currentStation.emptySlots} />
          </div>
        </SectionCard>

        {/* Doanh thu & Thuê xe */}
        <SectionCard icon={DollarSign} title="Tài chính">
          <div className="space-y-4">
            <StatRow 
              label="Tổng doanh thu" 
              value={<span className="text-primary text-lg">{(pickups.totalRevenue).toLocaleString('vi-VN')}đ</span>} 
            />
            <StatRow label="Thời gian thuê TB" value={`${pickups.avgDurationMinutes} phút`} />
          </div>
        </SectionCard>

        {/* Sự cố */}
        <SectionCard icon={AlertTriangle} title="Sự cố">
          <div className="space-y-4">
            <StatRow label="Tổng sự cố" value={incidents.totalIncidentsInPeriod} />
            <StatRow 
              label="Nghiêm trọng" 
              value={<span className={incidents.criticalOpenIncidents > 0 ? "text-destructive" : ""}>{incidents.criticalOpenIncidents}</span>} 
            />
            <StatRow 
              label="Đã xử lý" 
              value={<span className="text-green-600">{incidents.resolvedIncidentsInPeriod}</span>} 
            />
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chi tiết xe tại trạm */}
        <SectionCard icon={Bike} title="Chi tiết quản lý xe">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <StatRow label="Tổng số xe" value={currentStation.totalBikes} />
            <StatRow label="Sẵn sàng" value={<Badge className="bg-green-500">{currentStation.availableBikes}</Badge>} />
            <StatRow label="Đang đặt trước" value={currentStation.bookedBikes} />
            <StatRow label="Đang hỏng" value={<span className="text-destructive font-bold">{currentStation.brokenBikes}</span>} />
            <StatRow label="Đang bảo trì" value={currentStation.maintainedBikes} />
            <StatRow label="Không khả dụng" value={currentStation.unavailableBikes} />
          </div>
        </SectionCard>

        {/* Thống kê lượt thuê */}
        <SectionCard icon={TrendingUp} title="Hoạt động thuê & Trả">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-around rounded-lg bg-muted/50 p-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase">Lượt lấy xe</p>
                <p className="text-2xl font-bold flex items-center justify-center gap-1">
                  <ArrowUpRight className="h-5 w-5 text-green-500" />
                  {pickups.totalRentals}
                </p>
              </div>
              <div className="h-10 w-[1px] bg-border" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase">Lượt trả xe</p>
                <p className="text-2xl font-bold flex items-center justify-center gap-1">
                  <ArrowDownRight className="h-5 w-5 text-blue-500" />
                  {stats.returns.totalReturns}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <StatRow label="Thuê thành công" value={pickups.completedRentals} />
              <StatRow label="Thuê đã hủy" value={<span className="text-muted-foreground">{pickups.cancelledRentals}</span>} />
              <StatRow 
                label="Đại lý xác nhận trả" 
                value={<div className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-blue-500"/>{stats.returns.agencyConfirmedReturns}</div>} 
              />
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
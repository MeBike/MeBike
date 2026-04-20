"use client";

import { 
  Bike as BikeIcon, // Đổi tên để tránh trùng với type Bike
  Cpu, 
  MapPin, 
  Activity,
  History,
  Clock,
  User,
  ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatToVNTime } from "@/lib/formatVNDate";
import type { BikeRentalHistory, BikeActivityStats, BikeStats, Bike as BikeType } from "@/types";

// Mở rộng type Bike để khớp với UI bạn đang hiển thị 
// (vì interface gốc bạn đưa thiếu name, type, station, totalDistance...)
function SectionCard({
  icon: Icon,
  title,
  children,
  footer,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
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

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function bikeStatusVariant(status: string) {
  const s = status?.toUpperCase() || "";
  if (s.includes("AVAILABLE") || s.includes("SẴN SÀNG")) return "success";
  if (s.includes("RENTED") || s.includes("ĐANG THUÊ")) return "warning";
  if (s.includes("MAINTENANCE") || s.includes("BẢO TRÌ")) return "destructive";
  return "secondary";
}

export function BikeDetailView({ 
  bike, 
}: { 
  bike: BikeType | null; // Sử dụng Extended để dùng được bike.name, bike.station...
}) {
  if (!bike) return null;

  // const totalHours = activity ? Math.floor(activity.totalMinutesActive / 60) : 0;

  return (
    <div className="space-y-6">
      {/* Metadata bar */}
      <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-sm sm:flex-row sm:items-center sm:gap-x-8">
        <div>
          <span className="text-muted-foreground">ID Phương tiện: </span>
          <span className="font-mono text-xs font-bold text-foreground">{bike.id}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Cập nhật lần cuối: </span>
          <span className="text-foreground">{formatToVNTime(bike.updatedAt)}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard icon={BikeIcon} title="Thông tin cơ bản">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            
              <Field 
                label="Trạng thái hiện tại" 
                value={
                  <Badge variant={bikeStatusVariant(bike.status)} className="rounded-full">
                    {bike.status}
                  </Badge>
                } 
              />
              <Field label="Loại xe" value={"Xe đạp"} />
              <Field label="Nhà cung cấp" value={bike.supplier.name} />
            </div>
          </SectionCard>

        </div>

        <div className="space-y-6">
          <SectionCard icon={MapPin} title="Vị trí hiện tại">
            <div className="space-y-4">
              {/* Đã sửa lỗi: Truy cập vào bike.station.name */}
              <Field 
                label="Trạm hiện tại" 
                value={bike.station?.name || `Tên trạm: ${bike.station.name}` || "Đang di chuyển"} 
              />
            </div>
          </SectionCard>

          {/* <SectionCard icon={Activity} title="Thống kê hoạt động">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-muted-foreground">Tổng số chuyến</span>
                <span className="font-bold text-foreground">{statisticData?.totalRentals || 0}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-muted-foreground">Doanh thu tạo ra</span>
                <span className="font-bold text-primary">{(statisticData?.totalRevenue || 0).toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          </SectionCard> */}
        </div>
      </div>
    </div>
  );
}
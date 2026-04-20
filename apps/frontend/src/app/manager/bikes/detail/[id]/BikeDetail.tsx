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
import type { BikeRentalHistory, BikeActivityStats, BikeStats, Bike as BikeType, BikeStatus } from "@/types";

// Mở rộng type Bike để khớp với UI bạn đang hiển thị 
export const getStatusConfig = (status: BikeStatus) => {
  switch (status) {
    case "BOOKED":
      return { label: "Đã đặt", color: "bg-yellow-100 text-yellow-800 border-yellow-200" };
    case "MAINTENANCE":
      return { label: "Đang bảo trì", color: "bg-blue-100 text-blue-800 border-blue-200" };
    case "BROKEN":
      return { label: "Đang hỏng", color: "bg-red-100 text-red-800 border-red-200" };
    case "AVAILABLE":
      return { label: "Sẵn sàng", color: "bg-green-100 text-green-800 border-green-200" };
    case "RESERVED":
      return { label: "Đã giữ chỗ", color: "bg-orange-100 text-orange-800 border-orange-200" };
    default:
      return { label: status, color: "bg-gray-100 text-gray-800 border-gray-200" };
  }
};
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
  bike: BikeType | null; 
}) {
  if (!bike) return null;
  const statusInfo = getStatusConfig(bike.status);
  return (
    <div className="space-y-6">
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
                  <Badge className={cn("rounded-full px-3 py-1 font-semibold border shadow-none", statusInfo.color)}>
                {statusInfo.label}
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
              <Field 
                label="Trạm hiện tại" 
                value={bike.station?.name || `Tên trạm: ${bike.station.name}` || "Đang di chuyển"} 
              />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
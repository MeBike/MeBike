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
  rentals,
}: { 
  bike: BikeType | null; // Sử dụng Extended để dùng được bike.name, bike.station...
  rentals: BikeRentalHistory[];
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
              <Field label="Tên xe / Model" value={`Bike #${bike.chipId.slice(-4)}`} />
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

          <SectionCard icon={Cpu} title="Thông số kỹ thuật & Chip">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field label="Mã Chip (Chip ID)" value={<code className="text-primary font-bold">{bike.chipId}</code>} />
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

      <SectionCard icon={History} title="Lịch sử thuê xe gần đây">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs font-medium uppercase text-muted-foreground">
              <tr className="border-b border-border/60">
                <th className="pb-3 pr-4 font-semibold">Khách hàng</th>
                <th className="pb-3 pr-4 font-semibold">Hành trình</th>
                <th className="pb-3 pr-4 font-semibold">Thời gian</th>
                <th className="pb-3 text-right font-semibold">Tổng tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {rentals.length > 0 ? (
                rentals.map((rental) => (
                  <tr key={rental.id} className="group transition-colors hover:bg-muted/30">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary uppercase text-[10px] font-bold">
                          {rental.user.fullname.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{rental.user.fullname}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">{rental.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-medium text-foreground">{rental.startStation.name}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium text-foreground">{rental.endStation.name}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground italic">Thời lượng: {rental.duration} phút</p>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatToVNTime(rental.startTime)}
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <span className="font-bold text-primary">{rental.totalPrice.toLocaleString("vi-VN")}đ</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground italic">Chưa có lịch sử thuê.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
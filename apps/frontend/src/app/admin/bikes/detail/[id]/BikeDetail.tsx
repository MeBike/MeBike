"use client";

import {
  Bike as BikeIcon,
  Cpu,
  MapPin,
  Activity,
  History,
  Clock,
  User,
  ArrowRight,
  ArrowLeft,
  Star, // Thêm icon Star cho ratings
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatToVNTime } from "@/lib/formatVNDate";
import type {
  BikeRentalHistory,
  BikeActivityStats,
  BikeStats,
  Bike as BikeType,
} from "@/types";
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
      {footer}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
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
  activity,
  rentals,
  statisticData,
}: {
  bike: BikeType;
  activity: BikeActivityStats | null;
  rentals: BikeRentalHistory[];
  statisticData: BikeStats | null;
}) {
  const router = useRouter();
  const totalHours = activity
    ? Math.floor(activity.totalMinutesActive / 60)
    : 0;
  return (
    <>
      <div className=" bg-slate-50 p-6 dark:bg-background">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Chi tiết xe: {bike?.chipId || "N/A"}
              </h1>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push("/admin/bikes")}
            >
              Danh sách xe
            </Button>
          </div>
        </div>
      </div>
      <div className="space-y-6">

        <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-sm sm:flex-row sm:items-center sm:gap-x-8">
          <div>
            <span className="text-muted-foreground">ID: </span>
            <span className="font-mono text-xs font-bold text-foreground">
              {bike.id}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Số hiệu xe: </span>
            <span className="font-semibold text-foreground">
              {bike.bikeNumber || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Cập nhật: </span>
            <span className="text-foreground">
              {formatToVNTime(bike.updatedAt)}
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Thông tin cơ bản */}
            <SectionCard icon={BikeIcon} title="Thông tin cơ bản">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field
                  label="Tên xe / Model"
                  value={`Xe #${bike.bikeNumber}`}
                />
                <Field
                  label="Trạng thái"
                  value={
                    <Badge
                      variant={bikeStatusVariant(bike.status)}
                      className="rounded-full"
                    >
                      {bike.status}
                    </Badge>
                  }
                />
                <Field
                  label="Nhà cung cấp"
                  value={bike.supplier?.name || "Hệ thống"}
                />

                {/* Thêm hiển thị Ratings vào đây */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Đánh giá khách hàng
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm font-bold text-foreground">
                        {bike.rating?.averageRating ||
                          bike.averageRating ||
                          "0.0"}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      ({bike.rating?.totalRatings || bike.totalRatings || 0}{" "}
                      lượt)
                    </span>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard icon={Cpu} title="Thông số kỹ thuật & Chip">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field
                  label="Mã Chip"
                  value={
                    <code className="text-primary font-bold">
                      {bike.chipId}
                    </code>
                  }
                />
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard icon={MapPin} title="Vị trí">
              <Field
                label="Trạm hiện tại"
                value={
                  bike.station?.name ||
                  `Tên trạm: ${bike.station.name}` ||
                  "Ngoài trạm"
                }
              />
            </SectionCard>

            <SectionCard icon={Activity} title="Thống kê">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-muted-foreground">
                    Tổng số chuyến
                  </span>
                  <span className="font-bold">
                    {statisticData?.totalRentals || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-muted-foreground">
                    Hoạt động
                  </span>
                  <span className="font-bold">
                    {totalHours}h{" "}
                    {activity ? activity.totalMinutesActive % 60 : 0}m
                  </span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-muted-foreground">
                    Doanh thu
                  </span>
                  <span className="font-bold text-primary">
                    {(statisticData?.totalRevenue || 0).toLocaleString("vi-VN")}
                    đ
                  </span>
                </div>
              </div>
            </SectionCard>
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
                    <tr
                      key={rental.id}
                      className="group hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                            {rental.user.fullname.charAt(0)}
                          </div>
                          <p className="font-medium">{rental.user.fullname}</p>
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-xs">
                        <div className="flex items-center gap-1.5 font-medium">
                          {rental.startStation.name}{" "}
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />{" "}
                          {rental.endStation.name}
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-xs text-muted-foreground">
                        {formatToVNTime(rental.startTime)}
                      </td>
                      <td className="py-4 text-right font-bold text-primary">
                        {rental.totalPrice.toLocaleString("vi-VN")}đ
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Chưa có dữ liệu lịch sử.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </>
  );
}

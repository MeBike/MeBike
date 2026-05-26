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
import { getStatusConfig } from "@/columns/bike-colums";
import type {
  Bike,
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
  // activity,
  // rentals,
  // statisticData,
}: {
  bike: Bike;
  // activity: BikeActivityStats | null;
  // rentals: BikeRentalHistory[];
  // statisticData: BikeStats | null;
}) {
  const router = useRouter();
  // const totalHours = activity
  //   ? Math.floor(activity.totalMinutesActive / 60)
  //   : 0;
  const statusInfo = getStatusConfig(bike.status);
  
  return (
    <>
      <div className="">
        <div className="space-y-6">
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
                Chi tiết xe
              </h1>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push("/staff/bikes")}
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
            <SectionCard icon={BikeIcon} title="Thông tin cơ bản">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field
                  label="Tên xe / Model"
                  value={`Xe #${bike.bikeNumber || "N/A"}`}
                />
                <Field
                  label="Trạng thái"
                  value={
                    <Badge
                      className={cn(
                        "rounded-full px-3 py-1 font-semibold border shadow-none",
                        statusInfo.color,
                      )}
                    >
                      {statusInfo.label}
                    </Badge>
                  }
                />
                <Field
                  label="Nhà cung cấp"
                  value={bike.supplier?.name || "Hệ thống"}
                />
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
          </div>

          <div className="space-y-6">
            <SectionCard icon={MapPin} title="Vị trí">
              <Field
                label="Trạm hiện tại"
                value={
                  bike.station?.name || "Đang di chuyển"
                }
              />
            </SectionCard>
          </div>
        </div>
      </div>
    </>
  );
}

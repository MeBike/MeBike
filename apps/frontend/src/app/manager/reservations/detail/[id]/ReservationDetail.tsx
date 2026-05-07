"use client";
import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useReservationActions } from "@/hooks/use-reservation";
import {
  ArrowLeft,
  Bike,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  User,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatToVNTime } from "@/lib/formatVNDate";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { formatCurrency } from "@/utils/formatCurrency";
import { getStatusConfig } from "@/columns/bike-colums";
import type { BikeStatus } from "@/types";
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
export const getStatusReservationConfig = (status: string) => {
  switch (status) {
    case "FULFILLED":
      return { label: "Thành công", className: "bg-green-100 text-green-800" };
    case "PENDING":
      return {
        label: "Đang chờ xử lý",
        className: "bg-yellow-100 text-yellow-800",
      };
    case "EXPIRED":
      return { label: "Hết hạn", className: "bg-orange-100 text-orange-800" };
    case "CANCELLED":
      return { label: "Đã hủy", className: "bg-gray-200 text-gray-800" };
    default:
      return { label: status, className: "bg-gray-100 text-gray-800" };
  }
};
const RESERVATION_CONFIG: Record<string, { label: string; color: string }> = {
  ONE_TIME: {
    label: "Thuê một lần",
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  FIXED_SLOT: {
    label: "Khung giờ cố định",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  SUBSCRIPTION: {
    label: "Gói đăng ký",
    color: "bg-cyan-100 text-cyan-700 border-cyan-200",
  },
};
export default function ReservationDetailClient() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const {
    fetchDetailReservationForStaff,
    detailReservationForStaff,
    isLoadingDetailReservation,
  } = useReservationActions({
    hasToken: true,
    id: id,
  });
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(true);
  useEffect(() => {
    if (isLoadingDetailReservation) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoadingDetailReservation]);
  useEffect(() => {
    if (id) {
      fetchDetailReservationForStaff();
    }
  }, [id, fetchDetailReservationForStaff]);
  if (isVisualLoading) return <LoadingScreen />;
  if (!detailReservationForStaff) {
    notFound();
  }

  const data =  detailReservationForStaff;
   const { label : bikeStatusLabel, color : bikeColorLabel } = getStatusConfig(data.bike.status as BikeStatus);
    const { label : reservationStatusLabel , className : reservationStatusColor} = getStatusReservationConfig(data.status);
  return (
    <div className="-m-6 min-h-[calc(100vh-5rem)] bg-slate-50 p-6 dark:bg-background">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Chi tiết đặt chỗ
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${reservationStatusColor}`}
            >
              {reservationStatusLabel}
            </span>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/manager/reservations")}
          >
            Quay lại danh sách
          </Button>
        </div>

        {/* Metadata bar */}
        <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-sm sm:flex-row sm:items-center sm:gap-x-8">
          <div>
            <span className="text-muted-foreground">Mã đặt chỗ: </span>
            <span className="font-mono text-xs font-bold text-foreground">
              {data.id}
            </span>
          </div>
          <div className="sm:ml-auto">
            <span className="text-muted-foreground">Khởi tạo: </span>
            <span className="text-foreground">
              {formatToVNTime(data.createdAt)}
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Cột trái */}
          <div className="space-y-6 lg:col-span-2">
            <SectionCard
              icon={MapPin}
              title="Thông tin địa điểm & Thời gian"
              footer={
                <div className="flex items-center gap-2 border-t border-border/60 bg-muted/30 px-5 py-3 text-sm">
                  <Info className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">
                    Cập nhật lần cuối:
                  </span>
                  <span className="font-medium">
                    {formatToVNTime(data.updatedAt)}
                  </span>
                </div>
              }
            >
              <div className="space-y-10 relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-border to-muted" />
                <div className="relative pl-8">
                  {/* Dot icon */}
                  <div className="absolute left-0 top-1 z-10 h-4 w-4 rounded-full border-2 border-primary bg-background shadow-[0_0_0_4px_rgba(59,130,246,0.1)]" />

                  <div className="flex flex-col gap-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      Điểm lấy xe
                    </p>
                    <h4 className="text-base font-bold text-foreground leading-tight">
                      {data.station?.name || "N/A"}
                    </h4>
                    <p className="text-sm text-muted-foreground italic">
                      {data.station?.address}
                    </p>

                    <div className="mt-3 flex items-center gap-2 w-fit px-3 py-1.5 bg-secondary/50 rounded-lg border border-border">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        Thời gian nhận:{" "}
                        <span className="text-foreground">
                          {formatToVNTime(data.startTime)}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bước 2: Thời hạn giữ xe */}
                <div className="relative pl-8">
                  {/* Dot icon (đổi sang màu cảnh báo hoặc đỏ nếu là deadline) */}
                  <div className="absolute left-0 top-1 z-10 h-4 w-4 rounded-full border-2 border-amber-500 bg-background" />

                  <div className="flex flex-col gap-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                      Thời hạn đến nhận xe
                    </p>

                    <div className="flex items-baseline gap-2">
                      <p className="text-base font-semibold text-foreground">
                        {data.endTime ? "Hết hạn lúc:" : "Đang chờ nhận xe"}
                      </p>
                      <span className="text-sm font-bold text-amber-600">
                        {data.endTime ? formatToVNTime(data.endTime) : "--:--"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard icon={Bike} title="Thông tin phương tiện">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field
                  label="Mã số xe (ID)"
                  value={<span className="font-mono">{data.bike?.id}</span>}
                />
                <Field
                  label="Trạng thái xe"
                  value={
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${bikeColorLabel}`}
                    >
                      {bikeStatusLabel}
                    </span>
                  }
                />
                <Field label="ID Trạm hiện tại" value={data.stationId} />
              </div>
            </SectionCard>
          </div>

          {/* Cột phải */}
          <div className="space-y-6">
            <SectionCard icon={User} title="Khách hàng">
              <div className="space-y-4">
                <Field
                  label="Họ tên"
                  value={data.user?.fullName || data.user?.username}
                />
                <Field
                  label="Email"
                  value={<span className="break-all">{data.user?.email}</span>}
                />
                <Field
                  label="Số điện thoại"
                  value={data.user?.phoneNumber || "Chưa cập nhật"}
                />
              </div>
            </SectionCard>

            <SectionCard icon={CreditCard} title="Thanh toán">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 text-center">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Tiền trả trước (Prepaid)
                </p>
                <p className="mt-2 text-3xl font-bold text-primary">
                  {formatCurrency(data.prepaid ?? 0)}
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phương thức:</span>
                  <span className="font-medium">Ví Mebike</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Loại đặt:</span>
                  <span className="font-medium">
                    {RESERVATION_CONFIG[data.reservationOption].label}
                  </span>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}

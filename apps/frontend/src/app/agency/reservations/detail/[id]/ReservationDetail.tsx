"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { useAgencyActions } from "@/hooks/use-agency";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
function statusBadgeVariant(
  status: string,
): "warning" | "pending" | "success" | "destructive" | "secondary" {
  const s = status?.toUpperCase() || "";
  if (s.includes("PENDING") || s.includes("WAITING")) return "warning";
  if (s.includes("CONFIRMED") || s.includes("ACTIVE")) return "pending";
  if (s.includes("COMPLETED") || s.includes("FINISHED")) return "success";
  if (s.includes("CANCELLED") || s.includes("REJECTED")) return "destructive";
  return "secondary";
}

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

export default function ReservationDetailClient() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const {
    getDetailReservationForAgency,
    detailReservationForAgency,
    isLoadingDetailReservationForAgency,
  } = useAgencyActions({
    hasToken: true,
    reservation_id: id,
  });
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(false);
  useEffect(() => {
    if (isLoadingDetailReservationForAgency) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingDetailReservationForAgency]);
  if (isVisualLoading) return <LoadingScreen />;
  useEffect(() => {
    if (id) {
      getDetailReservationForAgency();
    }
  }, [id, getDetailReservationForAgency]);
  if (!detailReservationForAgency) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <p className="text-muted-foreground">
          Không tìm thấy thông tin đặt chỗ.
        </p>
      </div>
    );
  }

  const data = detailReservationForAgency;
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
            <Badge
              variant={statusBadgeVariant(data.status)}
              className="rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase"
            >
              {data.status}
            </Badge>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/staff/reservations")}
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
          <div>
            <span className="text-muted-foreground">Tùy chọn: </span>
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {data.reservationOption}
            </Badge>
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
              <div className="space-y-8">
                {/* Trạm lấy xe */}
                <div className="relative pl-8">
                  <div className="absolute left-0 top-1 h-4 w-4 rounded-full border-4 border-primary bg-background" />
                  <div className="absolute left-[7px] top-5 h-16 w-0.5 bg-border" />
                  <p className="text-xs font-bold uppercase text-primary">
                    Trạm nhận xe
                  </p>
                  <p className="mt-1 text-base font-semibold">
                    {data.station?.name || "N/A"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {data.station?.address}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-foreground">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Bắt đầu: {formatToVNTime(data.startTime)}</span>
                  </div>
                </div>

                {/* Trạm trả xe (Dự kiến hoặc thực tế) */}
                <div className="relative pl-8">
                  <div className="absolute left-0 top-1 h-4 w-4 rounded-full border-4 border-muted-foreground/30 bg-background" />
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    Thời gian kết thúc
                  </p>
                  <p className="mt-1 text-base font-semibold">
                    {data.endTime
                      ? "Đã hoàn thành"
                      : "Đang trong thời gian đặt"}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-foreground">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Kết thúc:{" "}
                      {data.endTime ? formatToVNTime(data.endTime) : "--:--"}
                    </span>
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
                    <Badge variant="outline" className="capitalize">
                      {data.bike?.status}
                    </Badge>
                  }
                />
                <Field label="Mã Chip" value={data.bike?.chipId || "N/A"} />
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
                <div className="pt-2">
                  <Badge variant="success" className="rounded-full">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    {data.user?.role}
                  </Badge>
                </div>
              </div>
            </SectionCard>

            <SectionCard icon={CreditCard} title="Thanh toán">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 text-center">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Tiền trả trước (Prepaid)
                </p>
                <p className="mt-2 text-3xl font-bold text-primary">
                  {Number(data.prepaid || 0).toLocaleString("vi-VN")} VND
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phương thức:</span>
                  <span className="font-medium">Ví điện tử / QR</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Loại đặt:</span>
                  <span className="font-medium">{data.reservationOption}</span>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}

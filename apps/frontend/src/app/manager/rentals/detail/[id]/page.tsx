"use client";
import { notFound } from "next/navigation";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRentalsActions } from "@/hooks/use-rental";
import { cn } from "@/lib/utils";
import { formatToVNTime } from "@/lib/formatVNDate";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
function rentalStatusBadgeVariant(
  status: string,
): "warning" | "pending" | "success" | "destructive" | "secondary" {
  const s = status.toUpperCase();
  if (s.includes("RESERVED") || s.includes("ĐẶT TRƯỚC")) return "warning";
  if (s.includes("RENTED") || s.includes("THUÊ")) return "pending";
  if (s.includes("COMPLETED") || s.includes("HOÀN THÀNH")) return "success";
  if (s.includes("CANCELLED") || s.includes("HỦY")) return "destructive";
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
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}
const renderStatus = (status: string) => {
  let label = "Không rõ";
  let className = "bg-gray-100 text-gray-800";
  if (status === "RENTED") {
    label = "Đang thuê";
    className = "bg-blue-100 text-blue-800";
  } else if (status === "COMPLETED") {
    label = "Đã hoàn thành";
    className = "bg-green-100 text-green-800";
  } else if (status === "OVERDUE_UNRETURNED"){
    label = "Quá hạn chưa trả"; 
    className = "bg-red-100 text-red-800";
  }
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
};
export default function AdminRentalDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const {
    detailDataForStaff: detailData,
    isDetailLoadingForStaff,
    getDetailRentalForStaff,
  } = useRentalsActions({
    hasToken: true,
    rental_id: id,
  });
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(true);
  useEffect(() => {
    if (isDetailLoadingForStaff) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isDetailLoadingForStaff]);
  useEffect(() => {
    if (id) {
      getDetailRentalForStaff();
    }
  }, [id, getDetailRentalForStaff]);
  if (isVisualLoading) return <LoadingScreen />;
  if (!detailData) {
    notFound();
  }
  const hasEnd = Boolean(detailData.endTime && detailData.endStation);
  const verifyRaw = String(detailData.user?.verify ?? "")
    .trim()
    .toUpperCase();
  const isVerified = verifyRaw === "VERIFIED";
  return (
    <div className="-m-6 min-h-[calc(100vh-5rem)] bg-slate-50 p-6 dark:bg-background">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => router.back()}
              aria-label="Quay lại"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Chi tiết đơn thuê
            </h1>
            {renderStatus(detailData.status)}
          </div>
          <Button
            variant="outline"
            className="shrink-0"
            onClick={() => router.push("/manager/rentals")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách
          </Button>
        </div>

        {/* Metadata bar */}
        <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-1">
          <div>
            <span className="text-muted-foreground">Mã đơn: </span>
            <span className="font-mono text-xs text-foreground md:text-sm">
              {detailData.id}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Cập nhật: </span>
            <span className="text-foreground">
              {formatToVNTime(detailData.updatedAt)}
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-2">
            <SectionCard
              icon={MapPin}
              title="Thông tin hành trình"
              footer={
                <div className="border-t border-border/60 bg-muted/30 px-5 py-3 text-sm text-muted-foreground">
                  Tổng thời lượng:{" "}
                  <span className="font-semibold text-foreground">
                    {detailData.duration ?? 0} phút
                  </span>
                </div>
              }
            >
              <div className="flex gap-3 sm:gap-4">
                {/* Cột timeline: chấm + đường nối — tách hẳn khỏi khối chữ */}
                <div
                  className="flex w-4 shrink-0 flex-col items-center self-stretch sm:w-5"
                  aria-hidden
                >
                  <div className="mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 border-primary bg-background shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]" />
                  <div className="min-h-10 w-px flex-1 bg-border" />
                  <div
                    className={cn(
                      "h-3 w-3 shrink-0 rounded-full border-2 bg-muted",
                      hasEnd
                        ? "border-muted-foreground/50"
                        : "border-muted-foreground/30",
                    )}
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-10">
                  {/* Start */}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Trạm bắt đầu
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {detailData.startStation?.name ?? "—"}
                    </p>
                    {detailData.startStation?.address ? (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {detailData.startStation.address}
                      </p>
                    ) : null}
                    {/* <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {detailData.startStation
                        ? `${detailData.startStation.latitude}, ${detailData.startStation.longitude}`
                        : ""}
                    </p> */}
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-foreground">
                      <Clock className="h-4 w-4 shrink-0 text-primary" />
                      {formatToVNTime(detailData.startTime)}
                    </div>
                  </div>

                  {/* End */}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Trạm kết thúc
                    </p>
                    <p
                      className={cn(
                        "mt-1 font-medium",
                        hasEnd
                          ? "text-foreground"
                          : "italic text-muted-foreground",
                      )}
                    >
                      {detailData.endStation?.name || "Chưa trả xe"}
                    </p>
                    {detailData.endStation?.address ? (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {detailData.endStation.address}
                      </p>
                    ) : null}
                    {/* {detailData.endStation ? (
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {detailData.endStation.latitude},{" "}
                        {detailData.endStation.longitude}
                      </p>
                    ) : null} */}
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 shrink-0" />
                      {detailData.endTime
                        ? formatToVNTime(detailData.endTime)
                        : "--:--:--"}
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard icon={Bike} title="Phương tiện">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Mã xe"
                  value={
                    detailData.bike?.id ? (
                      <span className="font-mono text-xs">
                        {detailData.bike.id}
                      </span>
                    ) : (
                      <span className="italic text-muted-foreground">
                        Chưa gán xe
                      </span>
                    )
                  }
                />
                <Field
                  label="Xe được gán"
                  value={
                    detailData.bike?.bikeNumber ? (
                      <span className="font-mono text-xs">
                        {detailData.bike.bikeNumber}
                      </span>
                    ) : (
                      <span className="italic text-muted-foreground">
                        Chưa gán xe
                      </span>
                    )
                  }
                />
                <Field
                  label="Trạng thái xe"
                  value={detailData.bike?.status || "Chưa có dữ liệu"}
                />
                <Field
                  label="Nhà cung cấp"
                  value={detailData.bike?.supplierId || "Chưa có dữ liệu"}
                />
              </div>
            </SectionCard>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <SectionCard icon={User} title="Khách hàng">
              <div className="space-y-4">
                <Field
                  label="Tên người dùng"
                  value={
                    detailData.user?.username ||
                    detailData.user?.fullname ||
                    "—"
                  }
                />
                <Field
                  label="Email"
                  value={
                    <span className="break-all font-normal">
                      {detailData.user?.email || "—"}
                    </span>
                  }
                />
                <Field
                  label="Số điện thoại"
                  value={detailData.user?.phoneNumber || "—"}
                />
                {isVerified ? (
                  <Badge
                    variant="success"
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    VERIFIED
                  </Badge>
                ) : (
                  <Badge variant="outline" className="rounded-full text-[11px]">
                    {detailData.user?.verify || "Chưa xác minh"}
                  </Badge>
                )}
              </div>
            </SectionCard>

            <SectionCard icon={CreditCard} title="Thanh toán">
              <div className="rounded-lg border border-primary/15 bg-primary/5 px-4 py-6 text-center">
                <p className="text-xs font-medium text-muted-foreground">
                  Tổng dự kiến
                </p>
                <p className="mt-2 text-3xl font-bold text-primary">
                  {(detailData.totalPrice ?? 0).toLocaleString("vi-VN")} VND
                </p>
              </div>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Thanh toán sẽ được tính khi chuyến đi kết thúc.
              </p>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  Calendar,
  Activity,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatToVNTime } from "@/lib/formatVNDate";
import type { Subscription } from "@/types";

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
        "overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm h-full flex flex-col",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border/60 px-5 py-4 bg-muted/20">
        <Icon className="h-5 w-5 shrink-0 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
          {title}
        </h2>
      </div>
      <div className="p-5 flex-1">{children}</div>
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

function getStatusConfig(status: string) {
  const s = status?.toUpperCase() || "";
  if (s === "ACTIVE")
    return {
      label: "Đang hoạt động",
      className: "bg-green-100 text-green-700 border-green-200",
      icon: CheckCircle2,
    };
  if (s === "EXPIRED")
    return {
      label: "Đã hết hạn",
      className: "bg-orange-100 text-orange-700 border-orange-200",
      icon: Clock,
    };
  if (s === "CANCELLED")
    return {
      label: "Đã hủy",
      className: "bg-red-100 text-red-700 border-red-200",
      icon: XCircle,
    };
  return {
    label: status,
    className: "bg-muted text-muted-foreground",
    icon: Activity,
  };
}

interface SubscriptionDetailClientProps {
  id: string;
  data: Subscription;
}

export default function SubscriptionDetailClient({
  id,
  data,
}: SubscriptionDetailClientProps) {
  const router = useRouter();

  const statusConfig = getStatusConfig(data.status);
  const StatusIcon = statusConfig.icon;

  const maxUsages = data.maxUsages || 1;
  const usagePercentage = Math.min(
    100,
    Math.round((data.usageCount / maxUsages) * 100),
  );
  const isUsageHigh = usagePercentage >= 90;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 rounded-xl border border-primary/10 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight">
                Chi tiết gói cước
              </h1>
              <Badge
                variant="outline"
                className={cn(
                  "font-medium flex items-center gap-1",
                  statusConfig.className,
                )}
              >
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
              </Badge>
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              ID: {data.id}
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard icon={Package} title="Thông tin gói đăng ký">
            <div className="space-y-8">
              <div className="flex items-start justify-between p-5 bg-primary/5 rounded-xl border border-primary/10">
                <div>
                  <p className="text-xs font-bold uppercase text-primary mb-1">
                    Tên gói cước
                  </p>
                  <p className="text-2xl font-extrabold text-foreground">
                    {data.packageName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                    Giá trị
                  </p>
                  <p className="text-xl font-bold text-green-600">
                    {typeof data.price === "number"
                      ? new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(data.price)
                      : data.price}
                  </p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Mức độ sử dụng
                  </span>
                  <span className="text-sm font-bold bg-muted px-3 py-1 rounded-md">
                    {data.usageCount}{" "}
                    <span className="text-muted-foreground font-medium">
                      / {data.maxUsages} lượt
                    </span>
                  </span>
                </div>
                <div className="h-4 w-full bg-muted rounded-full overflow-hidden border border-border/50">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-1000 shadow-sm",
                      isUsageHigh ? "bg-red-500" : "bg-primary",
                    )}
                    style={{ width: `${usagePercentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-right">
                  Đã dùng{" "}
                  <span className="font-bold text-foreground">
                    {usagePercentage}%
                  </span>{" "}
                  dung lượng gói
                </p>
              </div>

              {/* Thời hạn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-border/50">
                <div className="flex gap-4 items-center bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">
                      Ngày kích hoạt
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatToVNTime(data.activatedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 items-center bg-orange-50/50 p-4 rounded-lg border border-orange-100">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">
                      Ngày hết hạn
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatToVNTime(data.expiresAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
        <div className="lg:col-span-1">
          <SectionCard
            icon={User}
            title="Thông tin khách hàng"
            footer={
              <div className="border-t border-border/60 bg-muted/30 px-5 py-3 text-xs text-muted-foreground flex justify-between items-center">
                <span>Cập nhật lần cuối:</span>
                <span className="font-medium text-foreground">
                  {formatToVNTime(data.updatedAt)}
                </span>
              </div>
            }
          >
            <div className="space-y-6">
              <Field
                label="Họ và tên"
                value={
                  <span className="text-base font-bold text-foreground">
                    {data.user.fullName}
                  </span>
                }
              />

              <Field label="Email liên hệ" value={data.user.email} />

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Mã tài khoản (User ID)
                </p>
                <div className="bg-muted/50 p-3 rounded-lg font-mono text-xs break-all border border-border/50 text-muted-foreground">
                  {data.user.id}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

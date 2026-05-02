"use client";

import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Pencil, 
  History, 
  DollarSign, 
  Clock, 
  ShieldCheck, 
  BarChart3,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getPricingPolicyStatusConfig } from "@/columns/pricing-policy-column";
import { formatToVNTime } from "@/lib/formatVNDate";
import { PricingPolicyDetail } from "@/types";

interface Props {
  data: PricingPolicyDetail;
}

export default function PricingPolicyDetailClient({ data }: Props) {
  const router = useRouter();
  const statusConfig = getPricingPolicyStatusConfig(data.status);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{data.name}</h1>
            <p className="text-sm text-muted-foreground">ID: {data.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/admin/pricing-policies/${data.id}?edit=true`)}>
            <Pencil className="w-4 h-4 mr-2" /> Chỉnh sửa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cột trái: Thông tin chính */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-500" />
                Cấu hình chi phí
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Giá cơ bản (Base Rate)</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(data.base_rate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đơn vị tính phí</p>
                <p className="text-xl font-semibold">{data.billing_unit_minutes} phút / block</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phí giữ chỗ</p>
                <p className="text-lg font-semibold">{formatCurrency(data.reservation_fee)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tiền đặt cọc bắt buộc</p>
                <p className="text-lg font-semibold">{formatCurrency(data.deposit_required)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Quy định thời gian
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg border border-orange-100">
                <div>
                  <p className="font-medium text-orange-900">Thời điểm cắt trả muộn</p>
                  <p className="text-sm text-orange-700">Sau thời gian này sẽ tính phí phạt/phụ thu</p>
                </div>
                <span className="text-2xl font-mono font-bold text-orange-600">
                  {data.late_return_cutoff}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cột phải: Thống kê & Trạng thái */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trạng thái</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${statusConfig.color}`}>
                {statusConfig.label}
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ngày tạo:</span>
                  <span>{formatToVNTime(data.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cập nhật cuối:</span>
                  <span>{formatToVNTime(data.updated_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                Thống kê sử dụng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-white rounded-md border shadow-sm">
                  <p className="text-2xl font-bold">{data.usage_summary.reservation_count}</p>
                  <p className="text-[10px] uppercase text-muted-foreground">Đặt chỗ</p>
                </div>
                <div className="p-3 bg-white rounded-md border shadow-sm">
                  <p className="text-2xl font-bold">{data.usage_summary.rental_count}</p>
                  <p className="text-[10px] uppercase text-muted-foreground">Chuyến đi</p>
                </div>
              </div>

              {data.usage_summary.is_used && (
                <div className="flex gap-2 p-3 bg-blue-50 border border-blue-100 rounded-md">
                  <AlertCircle className="w-4 h-4 text-blue-500 shrink-0" />
                  <p className="text-[11px] text-blue-700 italic">
                    Chính sách này đang được áp dụng cho các giao dịch thực tế. Hạn chế chỉnh sửa các thông số cốt lõi.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
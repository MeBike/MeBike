"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  ArrowLeft, Pencil, DollarSign, Clock, 
  BarChart3, AlertCircle, Loader2, Play, Save, X 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

import { getPricingPolicyStatusConfig } from "@/columns/pricing-policy-column";
import { formatToVNTime } from "@/lib/formatVNDate";
import { PricingPolicyDetail } from "@/types";
import { updatePricingPolicySchema, UpdatePricingPolicyFormData } from "@/schemas/pricing-schema";

interface Props {
  data: PricingPolicyDetail;
  onActive: () => void;
  onUpdate: (data: UpdatePricingPolicyFormData) => Promise<void>;
  isActivating: boolean;
  isUpdating: boolean;
}

export default function PricingPolicyDetailClient({ 
  data, onActive, onUpdate, isActivating, isUpdating 
}: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<UpdatePricingPolicyFormData>({
    resolver: zodResolver(updatePricingPolicySchema),
    defaultValues: {
      name: data.name,
      base_rate: data.base_rate,
      billing_unit_minutes: data.billing_unit_minutes,
      reservation_fee: data.reservation_fee,
      deposit_required: data.deposit_required,
      late_return_cutoff: data.late_return_cutoff,
      status: data.status,
    },
  });

  useEffect(() => {
    form.reset({
      name: data.name,
      base_rate: data.base_rate,
      billing_unit_minutes: data.billing_unit_minutes,
      reservation_fee: data.reservation_fee,
      deposit_required: data.deposit_required,
      late_return_cutoff: data.late_return_cutoff,
      status: data.status,
    });
  }, [data, form]);

  const statusConfig = getPricingPolicyStatusConfig(data.status);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const onSubmit = async (values: UpdatePricingPolicyFormData) => {
    try {
      await onUpdate(values);
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  return (
    <Form {...form}>
      <div className="space-y-6 max-w-5xl mx-auto pb-10">
        
        {/* Header & Actions: LUÔN GIỮ NGUYÊN TEXT, KHÔNG HIỆN INPUT Ở ĐÂY */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 mr-4">
            <Button 
              type="button" 
              variant="outline" 
              size="icon" 
              onClick={() => isEditing ? handleCancel() : router.back()}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{data.name}</h1>
              <p className="text-sm text-muted-foreground">ID: {data.id}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                {data.status !== "ACTIVE" && (
                  <Button 
                    type="button"
                    variant="outline" 
                    className="border-green-600 text-green-600 hover:bg-green-50"
                    onClick={onActive}
                    disabled={isActivating}
                  >
                    {isActivating ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : <Play className="mr-2 w-4 h-4" />}
                    Kích hoạt
                  </Button>
                )}
                <Button type="button" onClick={() => setIsEditing(true)}>
                  <Pencil className="w-4 h-4 mr-2" /> Chỉnh sửa
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="ghost" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" /> Hủy
                </Button>
                <Button 
                  type="button" 
                  onClick={form.handleSubmit(onSubmit)} 
                  disabled={isUpdating} 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isUpdating ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : <Save className="w-4 h-4 mr-2" />}
                  Lưu thay đổi
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cột trái */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-500" />
                  Cấu hình chi phí
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-6">
                {/* Ô INPUT TÊN CHÍNH SÁCH ĐƯỢC DỜI XUỐNG ĐÂY (Chỉ hiện khi đang sửa) */}
                {isEditing && (
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <p className="text-sm text-muted-foreground mb-1 font-medium">Tên chính sách</p>
                          <FormControl>
                            <Input {...field} placeholder="Nhập tên chính sách..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Base Rate */}
                <FormField
                  control={form.control}
                  name="base_rate"
                  render={({ field }) => (
                    <FormItem>
                      <p className="text-sm text-muted-foreground mb-1 font-medium">Giá cơ bản (Base Rate)</p>
                      {isEditing ? (
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                        </FormControl>
                      ) : (
                        <p className="text-xl font-bold text-blue-600">{formatCurrency(data.base_rate)}</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Billing Unit */}
                <FormField
                  control={form.control}
                  name="billing_unit_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <p className="text-sm text-muted-foreground mb-1 font-medium">Đơn vị tính phí (Phút)</p>
                      {isEditing ? (
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                        </FormControl>
                      ) : (
                        <p className="text-xl font-semibold">{data.billing_unit_minutes} phút / block</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Reservation Fee */}
                <FormField
                  control={form.control}
                  name="reservation_fee"
                  render={({ field }) => (
                    <FormItem>
                      <p className="text-sm text-muted-foreground mb-1 font-medium">Phí giữ chỗ</p>
                      {isEditing ? (
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                        </FormControl>
                      ) : (
                        <p className="text-lg font-semibold">{formatCurrency(data.reservation_fee)}</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Deposit Required */}
                <FormField
                  control={form.control}
                  name="deposit_required"
                  render={({ field }) => (
                    <FormItem>
                      <p className="text-sm text-muted-foreground mb-1 font-medium">Tiền đặt cọc bắt buộc</p>
                      {isEditing ? (
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                        </FormControl>
                      ) : (
                        <p className="text-lg font-semibold">{formatCurrency(data.deposit_required)}</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
                  <Clock className="w-5 h-5" />
                  Quy định thời gian
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg border border-orange-100">
                  <div>
                    <p className="font-semibold text-orange-900 tracking-tight">Thời điểm cắt trả muộn</p>
                    <p className="text-sm text-orange-700 opacity-80">Sau mốc giờ này sẽ áp dụng phụ thu</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="late_return_cutoff"
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        {isEditing ? (
                          <FormControl>
                            <Input type="time" {...field} className="w-32 bg-white" />
                          </FormControl>
                        ) : (
                          <span className="text-2xl font-mono font-bold text-orange-600">
                            {data.late_return_cutoff}
                          </span>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cột phải: Thống kê & Trạng thái */}
          <div className="space-y-6">
            <Card className="border-t-4 border-t-blue-500 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Trạng thái hệ thống</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`inline-flex items-center px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${statusConfig.color}`}>
                  {statusConfig.label}
                </div>
                <Separator />
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Khởi tạo:</span>
                    <span className="font-medium">{formatToVNTime(data.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cập nhật:</span>
                    <span className="font-medium">{formatToVNTime(data.updated_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-50/50 border-dashed border-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-emerald-700">
                  <BarChart3 className="w-5 h-5" />
                  Hiệu quả sử dụng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-lg border shadow-sm text-center">
                    <p className="text-2xl font-black">{data.usage_summary.reservation_count}</p>
                    <p className="text-[9px] font-bold uppercase text-muted-foreground">Đặt chỗ</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border shadow-sm text-center">
                    <p className="text-2xl font-black">{data.usage_summary.rental_count}</p>
                    <p className="text-[9px] font-bold uppercase text-muted-foreground">Chuyến đi</p>
                  </div>
                </div>

                {data.usage_summary.is_used && (
                  <div className="flex gap-2.5 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-800 leading-tight">
                      <b>Lưu ý:</b> Chính sách này đang được lưu vết trong các giao dịch. Các thay đổi về giá sẽ có hiệu lực cho các phiên mới.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Form>
  );
}
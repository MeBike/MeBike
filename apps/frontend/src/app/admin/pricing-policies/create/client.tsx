"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  ArrowLeft, DollarSign, Clock, ShieldCheck, Loader2, Save 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Nếu bạn có components select của shadcn

import { createPricingPolicySchema, CreatePricingPolicyFormData } from "@/schemas/pricing-schema";

interface Props {
  onCreate: (data: CreatePricingPolicyFormData) => Promise<void>;
  isCreating?: boolean;
}

export default function PricingPolicyCreateClient({ onCreate, isCreating = false }: Props) {
  const router = useRouter();

  // Khởi tạo Form với các giá trị mặc định bằng 0 để tránh lỗi NaN
  const form = useForm<CreatePricingPolicyFormData>({
    resolver: zodResolver(createPricingPolicySchema),
    defaultValues: {
      name: "",
      base_rate: 0,
      billing_unit_minutes: 30, // Thường để mặc định là 30 hoặc 60 phút
      reservation_fee: 0,
      deposit_required: 0,
      late_return_cutoff: "23:59", // Giờ mặc định
      status: "INACTIVE", // Nên tạo ở trạng thái chưa hoạt động để an toàn
    },
  });

  const onSubmit = async (values: CreatePricingPolicyFormData) => {
    try {
      await onCreate(values);
      // Tạo thành công thì đá về trang danh sách
      router.push("/admin/pricing-policies");
    } catch (error) {
      console.error("Lỗi khi tạo:", error);
    }
  };

  return (
    <Form {...form}>
      <div className="space-y-6 max-w-5xl mx-auto pb-10">
        
        {/* Header & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 mr-4">
            <Button 
              type="button" 
              variant="outline" 
              size="icon" 
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Tạo chính sách giá mới</h1>
              <p className="text-sm text-muted-foreground">Thiết lập các thông số tài chính và quy định thời gian</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Hủy
            </Button>
            <Button 
              type="button" 
              onClick={form.handleSubmit(onSubmit)} 
              disabled={isCreating} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : <Save className="w-4 h-4 mr-2" />}
              Tạo chính sách
            </Button>
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
                
                {/* Tên chính sách chiếm 2 cột */}
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <p className="text-sm font-medium mb-1">Tên chính sách <span className="text-red-500">*</span></p>
                        <FormControl>
                          <Input {...field} placeholder="VD: Bảng giá tiêu chuẩn 2024" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="base_rate"
                  render={({ field }) => (
                    <FormItem>
                      <p className="text-sm font-medium mb-1">Giá cơ bản (VNĐ) <span className="text-red-500">*</span></p>
                      <FormControl>
                        <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="billing_unit_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <p className="text-sm font-medium mb-1">Đơn vị tính phí (Phút) <span className="text-red-500">*</span></p>
                      <FormControl>
                        <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reservation_fee"
                  render={({ field }) => (
                    <FormItem>
                      <p className="text-sm font-medium mb-1">Phí giữ chỗ (VNĐ)</p>
                      <FormControl>
                        <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deposit_required"
                  render={({ field }) => (
                    <FormItem>
                      <p className="text-sm font-medium mb-1">Tiền đặt cọc bắt buộc (VNĐ)</p>
                      <FormControl>
                        <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                      </FormControl>
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
                    <p className="font-semibold text-orange-900">Thời điểm cắt trả muộn <span className="text-red-500">*</span></p>
                    <p className="text-sm text-orange-700 opacity-80">Định dạng HH:mm (VD: 23:59)</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="late_return_cutoff"
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <Input type="time" {...field} className="w-32 bg-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cột phải: Khởi tạo trạng thái */}
          <div className="space-y-6">
            <Card className="border-t-4 border-t-blue-500 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 font-bold">
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                  Trạng thái khởi tạo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <p className="text-sm text-muted-foreground mb-2">Chọn trạng thái ban đầu cho chính sách này:</p>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn trạng thái" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="INACTIVE">Ngừng hoạt động (Lưu nháp)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="bg-slate-50 border-none shadow-none">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm font-semibold text-slate-700">Lưu ý trước khi tạo:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                  <li>Giá trị tiền tệ là VNĐ, không nhập số âm.</li>
                  <li>Chính sách đã tạo nếu có người sử dụng sẽ không thể xóa, chỉ có thể Tạm ngừng.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Form>
  );
}
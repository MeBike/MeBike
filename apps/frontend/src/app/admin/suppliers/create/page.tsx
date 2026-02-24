"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CreateSupplierSchema,
  createSupplierSchema,
} from "@/schemas/supplier.schema";
import { useSupplierActions } from "@/hooks/use-supplier";

export default function CreateSupplierPage() {
  const router = useRouter();
  const { createSupplier } = useSupplierActions(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateSupplierSchema>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: {
      name: "",
      address: "",
      phoneNumber: "",
      contractFee: 0,
    },
  });

  const onSubmit = async (data: CreateSupplierSchema) => {
    try {
      const result = await createSupplier(data);
      if (result?.status === 200) {
        router.push("/admin/suppliers");
      }
    } catch (err) {
      // Lỗi đã được xử lý trong hook (toast...)
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {/* Nút quay lại */}
        <Button
          variant="ghost"
          className="mb-6 -ml-2 text-muted-foreground"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại danh sách
        </Button>

        {/* Tiêu đề trang */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Thêm nhà cung cấp mới
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Điền thông tin để tạo nhà cung cấp vào hệ thống quản lý
          </p>
        </div>

        {/* Form chính */}
        <form 
          onSubmit={handleSubmit(onSubmit)} 
          className="space-y-6 rounded-lg border bg-card p-6 shadow-sm"
        >
          {/* Tên nhà cung cấp */}
          <div className="space-y-2">
            <Label htmlFor="name">Tên nhà cung cấp *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Nhập tên nhà cung cấp"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm font-medium text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Địa chỉ */}
          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ *</Label>
            <Input
              id="address"
              {...register("address")}
              placeholder="Nhập địa chỉ"
              className={errors.address ? "border-red-500" : ""}
            />
            {errors.address && (
              <p className="text-sm font-medium text-red-500">{errors.address.message}</p>
            )}
          </div>

          {/* Số điện thoại */}
          <div className="space-y-2">
            <Label htmlFor="phone_number">Số điện thoại *</Label>
            <Input
              id="phone_number"
              {...register("phoneNumber")}
              placeholder="Nhập số điện thoại"
              className={errors.phoneNumber ? "border-red-500" : ""}
            />
            {errors.phoneNumber && (
              <p className="text-sm font-medium text-red-500">{errors.phoneNumber.message}</p>
            )}
          </div>

          {/* Phí hợp đồng */}
          <div className="space-y-2">
            <Label htmlFor="contract_fee">Phí hợp đồng (0-1)</Label>
            <Input
              id="contract_fee"
              type="number"
              step="0.01"
              min="0"
              max="1"
              {...register("contractFee", { valueAsNumber: true })}
              placeholder="Ví dụ: 0.05"
              className={errors.contractFee ? "border-red-500" : ""}
            />
            {errors.contractFee && (
              <p className="text-sm font-medium text-red-500">{errors.contractFee.message}</p>
            )}
          </div>

          {/* Nhóm nút bấm */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang xử lý..." : "Tạo nhà cung cấp"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
            >
              Hủy
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSupplierActions } from "@/hooks/use-supplier";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateSupplierSchema,
  createSupplierSchema,
} from "@/schemas/supplier.schema";
import { Input } from "@/components/ui/input";
import type { Supplier } from "@/types";

export default function SupplierDetailPage() {
  const router = useRouter();
  const params = useParams<{ supplierId: string }>();
  const supplierId = params?.supplierId ?? "";
  const [isEditing, setIsEditing] = useState(false);

  const {
    detailSupplier,
    isLoadingDetailSupplier,
    fetchDetailSupplier,
    getUpdateSupplier,
  } = useSupplierActions(true, supplierId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateSupplierSchema>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: {
      name: "",
      address: "",
      phone_number: "",
      contract_fee: "",
    },
  });

  useEffect(() => {
    if (!supplierId) return;
    fetchDetailSupplier();
  }, [supplierId, fetchDetailSupplier]);

  const supplier = detailSupplier as unknown as Supplier | undefined;

  const openEditForm = () => {
    if (!supplier) return;
    reset({
      name: supplier.name || "",
      address: supplier.address || "",
      phone_number: supplier.phoneNumber || "",
      contract_fee: supplier.contractFee?.toString() || "",
    });
    setIsEditing(true);
  };

  const onSave = async (data: CreateSupplierSchema) => {
    await getUpdateSupplier({ id: supplierId, data });
    setIsEditing(false);
    fetchDetailSupplier();
  };

  const onCancelEdit = () => {
    setIsEditing(false);
  };

  if (!supplierId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Chi tiết nhà cung cấp</h1>
        <p className="text-muted-foreground">Không tìm thấy mã nhà cung cấp.</p>
        <Button variant="outline" onClick={() => router.push("/admin/suppliers")}>Quay lại danh sách</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Chi tiết nhà cung cấp</h1>
          <p className="text-muted-foreground mt-1">
            Thông tin nhà cung cấp và cập nhật
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isEditing && (
            <Button variant="default" onClick={openEditForm} disabled={!supplier}>
              Cập nhật
            </Button>
          )}
          <Button variant="outline" onClick={() => router.push("/admin/suppliers")}>Quay lại danh sách</Button>
        </div>
      </div>

      {isLoadingDetailSupplier ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-4" />
          <span className="text-lg text-foreground">Đang tải dữ liệu...</span>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-6 w-full">
          {isEditing ? (
            <form className="space-y-4" onSubmit={handleSubmit(onSave)}>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Tên nhà cung cấp
                </label>
                <Input type="text" {...register("name")} placeholder="Nhập tên" />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Địa chỉ
                </label>
                <Input type="text" {...register("address")} placeholder="Nhập địa chỉ" />
                {errors.address && (
                  <p className="text-sm text-red-500 mt-1">{errors.address.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Số điện thoại
                </label>
                <Input type="text" {...register("phone_number")} placeholder="Nhập số điện thoại" />
                {errors.phone_number && (
                  <p className="text-sm text-red-500 mt-1">{errors.phone_number.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Phí hợp đồng
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  {...register("contract_fee")}
                />
                {errors.contract_fee && (
                  <p className="text-sm text-red-500 mt-1">{errors.contract_fee.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={onCancelEdit} className="flex-1">
                  Hủy
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  Lưu
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Tên nhà cung cấp
                </label>
                <p className="text-foreground font-medium">{supplier?.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Địa chỉ
                </label>
                <p className="text-foreground font-medium">
                  {supplier?.address}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Số điện thoại
                </label>
                <p className="text-foreground font-medium">
                  {supplier?.phoneNumber}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Phí hợp đồng
                </label>
                <p className="text-foreground font-medium">
                  {supplier?.contractFee}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Trạng thái
                </label>
                <p className="text-foreground font-medium">{supplier?.status}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

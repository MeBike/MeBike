"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Save, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SupplierStatusBadge } from "@/components/supplier/SupplierStatusBadge";
import { useSupplierActions } from "@/hooks/use-supplier";
import {
  CreateSupplierSchema,
  createSupplierSchema,
} from "@/schemas/supplier.schema";
import type { Supplier } from "@/types";

export default function SupplierDetailPage() {
  const router = useRouter();
  const params = useParams<{ supplierId: string }>();
  const supplierId = params?.supplierId ?? "";
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState("");

  const {
    detailSupplier,
    isLoadingDetailSupplier,
    fetchDetailSupplier,
    getUpdateSupplier,
  } = useSupplierActions(true, supplierId);

  const supplier = detailSupplier as unknown as Supplier | undefined;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateSupplierSchema>({
    resolver: zodResolver(createSupplierSchema),
  });

  useEffect(() => {
    if (!supplierId) return;
    fetchDetailSupplier();
  }, [supplierId, fetchDetailSupplier]);

  const openEditForm = () => {
    if (!supplier) return;
    reset({
      name: supplier.name || "",
      address: supplier.address || "",
      phoneNumber: supplier.phoneNumber || "",
      contractFee: supplier.contractFee || 0,
    });
    setEditStatus(supplier.status || "INACTIVE");
    setIsEditing(true);
  };

  const onSave = async (data: CreateSupplierSchema) => {
    const result = await getUpdateSupplier({ id: supplierId, data });
    if (result) {
      setIsEditing(false);
      fetchDetailSupplier();
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

  if (!supplierId || (!isLoadingDetailSupplier && !supplier)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Không tìm thấy nhà cung cấp</h2>
          <Button 
            className="mt-6" 
            onClick={() => router.push("/admin/suppliers")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-background/95 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-8 -ml-3 text-muted-foreground hover:text-foreground"
          onClick={() => router.push("/admin/suppliers")}
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Quay lại danh sách nhà cung cấp
        </Button>

        {/* Header Section */}
        <div className="mb-8 space-y-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {supplier?.name}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    ID: <span className="font-mono font-medium">{supplierId}</span>
                  </p>
                </div>
              </div>
            </div>

            {!isEditing ? (
              <Button 
                size="lg" 
                variant="default" 
                onClick={openEditForm} 
                disabled={isLoadingDetailSupplier}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Chỉnh sửa thông tin
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button 
                  size="lg"
                  variant="default"
                  onClick={handleSubmit(onSave)} 
                  disabled={isSubmitting}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Lưu thay đổi
                </Button>
                <Button 
                  size="lg"
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Hủy
                </Button>
              </div>
            )}
          </div>

          {/* Status Badge */}
          {!isEditing && (
            <div className="flex items-center gap-3 border-l-4 border-primary bg-primary/5 p-4 rounded-lg">
              <span className="text-sm font-medium text-muted-foreground">Trạng thái:</span>
              <SupplierStatusBadge status={supplier?.status || "INACTIVE"} />
            </div>
          )}
        </div>

        {isLoadingDetailSupplier ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card/50 py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-muted border-t-primary mb-4" />
            <p className="text-sm text-muted-foreground">Đang tải thông tin nhà cung cấp...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Main Information Card */}
            <div className="rounded-lg border border-border bg-card shadow-sm">
              <div className="border-b border-border bg-muted/30 px-8 py-6">
                <h2 className="text-lg font-semibold text-foreground">Thông tin chung</h2>
              </div>

              <div className="px-8 py-8">
                <div className="grid gap-8 sm:grid-cols-2">
                  {/* Tên nhà cung cấp */}
                  <FormField label="Tên nhà cung cấp" required>
                    {isEditing ? (
                      <div>
                        <Input 
                          {...register("name")} 
                          placeholder="Nhập tên nhà cung cấp"
                          className={`text-base h-11 ${errors.name ? "border-red-500 bg-red-50/30" : ""}`} 
                        />
                        {errors.name && (
                          <p className="text-sm text-red-500 mt-2">{errors.name.message}</p>
                        )}
                      </div>
                    ) : (
                      <div className="text-base font-medium text-foreground bg-muted/20 rounded-lg px-4 py-3">
                        {supplier?.name}
                      </div>
                    )}
                  </FormField>

                  {/* Số điện thoại */}
                  <FormField label="Số điện thoại" required>
                    {isEditing ? (
                      <div>
                        <Input 
                          {...register("phoneNumber")} 
                          placeholder="Nhập số điện thoại"
                          className={`text-base h-11 ${errors.phoneNumber ? "border-red-500 bg-red-50/30" : ""}`} 
                        />
                        {errors.phoneNumber && (
                          <p className="text-sm text-red-500 mt-2">{errors.phoneNumber.message}</p>
                        )}
                      </div>
                    ) : (
                      <div className="text-base font-medium text-foreground bg-muted/20 rounded-lg px-4 py-3">
                        {supplier?.phoneNumber}
                      </div>
                    )}
                  </FormField>

                  {/* Địa chỉ */}
                  <FormField label="Địa chỉ" required className="sm:col-span-2">
                    {isEditing ? (
                      <div>
                        <Input 
                          {...register("address")} 
                          placeholder="Nhập địa chỉ"
                          className={`text-base h-11 ${errors.address ? "border-red-500 bg-red-50/30" : ""}`} 
                        />
                        {errors.address && (
                          <p className="text-sm text-red-500 mt-2">{errors.address.message}</p>
                        )}
                      </div>
                    ) : (
                      <div className="text-base font-medium text-foreground bg-muted/20 rounded-lg px-4 py-3">
                        {supplier?.address}
                      </div>
                    )}
                  </FormField>

                  {/* Phí hợp đồng */}
                  <FormField label="Phí hợp đồng (VND)">
                    {isEditing ? (
                      <div>
                        <Input 
                          type="number" 
                          step="1" 
                           {...register("contractFee", { valueAsNumber: true })}
                          placeholder="0"
                          className={`text-base h-11 ${errors.contractFee ? "border-red-500 bg-red-50/30" : ""}`} 
                        />
                        {errors.contractFee && (
                          <p className="text-sm text-red-500 mt-2">{errors.contractFee.message}</p>
                        )}
                      </div>
                    ) : (
                      <div className="text-base font-medium text-foreground bg-muted/20 rounded-lg px-4 py-3">
                        {supplier?.contractFee ? formatCurrency(supplier.contractFee) : "Chưa xác định"}
                      </div>
                    )}
                  </FormField>

                  {/* Trạng thái (Edit Mode) */}
                  {isEditing && (
                    <FormField label="Trạng thái">
                      <Select value={editStatus} onValueChange={setEditStatus}>
                        <SelectTrigger className="h-11 text-base">
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                          <SelectItem value="INACTIVE">Không hoạt động</SelectItem>
                          <SelectItem value="TERMINATED">Đã kết thúc</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Form Field Component
function FormField({
  label,
  required = false,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="text-sm font-semibold text-foreground mb-3 block">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
    </div>
  );
}
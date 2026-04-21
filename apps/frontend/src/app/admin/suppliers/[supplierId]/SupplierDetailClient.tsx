"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Save, X, Bike, CheckCircle2, AlertCircle, Clock, Zap, Wrench, Lock } from "lucide-react";
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
import type { StatsSupplierBike } from "@/types";
import {
  UpdateSupplierSchema,
  updateSupplierSchema,
} from "@/schemas/supplier-schema";
import type { Supplier } from "@/types";

interface SupplierDetailClientProps {
  supplierId: string;
  supplier: Supplier;
  bikeStats?: StatsSupplierBike;
  onSubmit: (data: UpdateSupplierSchema) => Promise<boolean>;
}

export default function SupplierDetailClient({
  supplierId,
  supplier,
  bikeStats,
  onSubmit,
}: SupplierDetailClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState(supplier.status || "INACTIVE");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateSupplierSchema>({
    resolver: zodResolver(updateSupplierSchema),
    mode: "onChange", // <--- THÊM DÒNG NÀY: Giúp báo lỗi real-time ngay khi đang gõ
    defaultValues: {
      name: supplier.name || "",
      address: supplier.address || "",
      phoneNumber: supplier.phoneNumber || "",
      contractFee: supplier.contractFee || 0,
      status: supplier.status || "INACTIVE",
    },
  });

  const openEditForm = () => {
    const currentStatus = supplier.status || "INACTIVE";
    reset({
      name: supplier.name || "",
      address: supplier.address || "",
      phoneNumber: supplier.phoneNumber || "",
      contractFee: supplier.contractFee || 0,
      status: currentStatus,
    });
    setEditStatus(currentStatus);
    setIsEditing(true);
  };

  const onSave = async (data: UpdateSupplierSchema) => {
    const success = await onSubmit(data);
    if (success) {
      setIsEditing(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);

  const statsConfig = [
    { label: "Tổng xe", key: "totalBikes", icon: Bike, color: "from-blue-500 to-cyan-500", bgColor: "bg-blue-50" },
    { label: "Sẵn sàng", key: "available", icon: CheckCircle2, color: "from-green-500 to-emerald-500", bgColor: "bg-green-50" },
    { label: "Đã đặt", key: "booked", icon: Zap, color: "from-amber-500 to-orange-500", bgColor: "bg-amber-50" },
    { label: "Bị hỏng", key: "broken", icon: AlertCircle, color: "from-red-500 to-rose-500", bgColor: "bg-red-50" },
    { label: "Đã đặt trước", key: "reserved", icon: Clock, color: "from-purple-500 to-violet-500", bgColor: "bg-purple-50" },
    { label: "Bảo trì", key: "maintained", icon: Wrench, color: "from-gray-500 to-slate-500", bgColor: "bg-gray-50" },
    { label: "Không khả dụng", key: "unavailable", icon: Lock, color: "from-slate-500 to-zinc-500", bgColor: "bg-slate-50" },
  ];

  return (
    <div className="w-full space-y-5">
      <Button
        variant="ghost"
        className="-ml-3 mb-1 text-muted-foreground hover:text-foreground"
        onClick={() => router.push("/admin/suppliers")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Quay lại danh sách
      </Button>

      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {supplier.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            ID: <span className="font-mono font-medium">{supplierId}</span>
          </p>
        </div>

        {!isEditing ? (
          <Button variant="default" onClick={openEditForm}>
            <Pencil className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="default" onClick={handleSubmit(onSave)} disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              Lưu thay đổi
            </Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              <X className="mr-2 h-4 w-4" />
              Hủy
            </Button>
          </div>
        )}
      </div>

      {!isEditing && (
        <div className="flex w-fit items-center gap-3 rounded-lg border-l-4 border-primary bg-primary/5 px-4 py-2">
          <span className="text-sm font-medium text-muted-foreground">Trạng thái:</span>
          <SupplierStatusBadge status={supplier.status || "INACTIVE"} />
        </div>
      )}

      <div className="space-y-5">
        {bikeStats && (
          <div className="rounded-lg border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/30 px-5 py-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Thống kê xe đạp</h2>
            </div>
            <div className="p-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statsConfig.map((stat) => {
                  const Icon = stat.icon as React.ElementType;
                  const value = (bikeStats[stat.key as keyof typeof bikeStats] as number) || 0;
                  const totalBikes = (bikeStats.totalBikes as number) || 0;
                  const percentage = totalBikes > 0 ? ((value / totalBikes) * 100).toFixed(1) : 0;

                  return (
                    <div key={stat.key} className={`${stat.bgColor} rounded-lg p-4 border border-border/40`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                          <p className="text-xl font-bold text-foreground">{value}</p>
                          <p className="text-[10px] text-muted-foreground opacity-70">{percentage}%</p>
                        </div>
                        <div className={`rounded-md p-2 bg-linear-to-br ${stat.color} shadow-sm`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border bg-muted/30 px-5 py-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Thông tin chi tiết</h2>
          </div>
          <div className="p-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Tên nhà cung cấp" required>
                {isEditing ? (
                  <div>
                    <Input {...register("name")} className={errors.name ? "border-red-500" : ""} />
                    {errors.name && <p className="mt-1 text-xs font-medium text-red-500">{errors.name.message}</p>}
                  </div>
                ) : (
                  <div className="rounded-md bg-muted/20 px-3 py-2 text-sm font-medium">{supplier.name}</div>
                )}
              </FormField>

              <FormField label="Số điện thoại" required>
                {isEditing ? (
                  <div>
                    <Input {...register("phoneNumber")} className={errors.phoneNumber ? "border-red-500" : ""} />
                    {errors.phoneNumber && <p className="mt-1 text-xs font-medium text-red-500">{errors.phoneNumber.message}</p>}
                  </div>
                ) : (
                  <div className="rounded-md bg-muted/20 px-3 py-2 text-sm font-medium">{supplier.phoneNumber}</div>
                )}
              </FormField>

              <FormField label="Địa chỉ" required className="sm:col-span-2">
                {isEditing ? (
                  <div>
                    <Input {...register("address")} className={errors.address ? "border-red-500" : ""} />
                    {errors.address && <p className="mt-1 text-xs font-medium text-red-500">{errors.address.message}</p>}
                  </div>
                ) : (
                  <div className="rounded-md bg-muted/20 px-3 py-2 text-sm font-medium">{supplier.address}</div>
                )}
              </FormField>

              <FormField label="Phí hợp đồng (%)" required>
                {isEditing ? (
                  <div>
                    <Input type="number" {...register("contractFee", { valueAsNumber: true })} className={errors.contractFee ? "border-red-500" : ""} />
                    {errors.contractFee && <p className="mt-1 text-xs font-medium text-red-500">{errors.contractFee.message}</p>}
                  </div>
                ) : (
                  <div className="rounded-md bg-muted/20 px-3 py-2 text-sm font-medium">
                    {supplier.contractFee}
                  </div>
                )}
              </FormField>

              {isEditing && (
                <FormField label="Trạng thái">
                  <Select 
                    value={editStatus} 
                    onValueChange={(val) => {
                      const statusVal = val as "ACTIVE" | "INACTIVE" | "TERMINATED";
                      setEditStatus(statusVal);
                      setValue("status", statusVal, { shouldValidate: true });
                    }}
                  >
                    <SelectTrigger className={errors.status ? "border-red-500" : ""}>
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                      <SelectItem value="INACTIVE">Không hoạt động</SelectItem>
                      <SelectItem value="TERMINATED">Đã kết thúc</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="mt-1 text-xs font-medium text-red-500">{errors.status.message}</p>}
                </FormField>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs font-bold uppercase text-muted-foreground/80">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  );
}
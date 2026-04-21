"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, MapPin, Activity, Loader2, AlertCircle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateBikeSchema, UpdateBikeSchemaFormData } from "@/schemas/bike-schema";
import { cn } from "@/lib/utils";
import type { Bike, Station, BikeStatus, Supplier } from "@/types";

const ALLOWED_TRANSITIONS: Record<string, BikeStatus[]> = {
  AVAILABLE: ["BROKEN", "MAINTENANCE", "UNAVAILABLE"],
  BROKEN: ["AVAILABLE"],
  MAINTENANCE: ["AVAILABLE"],
  UNAVAILABLE: ["AVAILABLE"],
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  AVAILABLE: { label: "Sẵn sàng", color: "bg-green-500" },
  BROKEN: { label: "Hỏng hóc", color: "bg-red-500" },
  MAINTENANCE: { label: "Bảo trì", color: "bg-amber-500" },
  UNAVAILABLE: { label: "Không khả dụng", color: "bg-slate-500" },
  RENTED: { label: "Đang được thuê", color: "bg-blue-500" },
  BOOKED: { label: "Đã đặt chỗ", color: "bg-purple-500" },
};

interface UpdateBikeDialogProps {
  bike: Bike;
  stations: Station[];
  suppliers: Supplier[];
  onUpdate: (data: UpdateBikeSchemaFormData) => Promise<void>;
  isUpdating: boolean;
}

export function UpdateBikeDialog({
  bike,
  stations,
  suppliers,
  onUpdate,
  isUpdating,
}: UpdateBikeDialogProps) {
  const [open, setOpen] = useState(false);

  const {
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<UpdateBikeSchemaFormData>({
    resolver: zodResolver(updateBikeSchema),
    defaultValues: {
      stationId: bike?.station?.id ? String(bike.station.id) : "",
      status: bike?.status as BikeStatus,
      supplierId: bike?.supplier?.id ? String(bike.supplier.id) : "",
    },
  });

  // Reset form mỗi khi bike thay đổi hoặc Dialog được mở
  useEffect(() => {
    console.log("Dữ liệu nhà cung cấp của xe:", bike?.supplier);
    console.log("Dữ liệu trạm của xe:", bike?.station);
    if (open) {
      reset({
        stationId: bike?.station?.id ? String(bike.station.id) : "",
        status: bike?.status as BikeStatus,
        supplierId: bike?.supplier?.id ? String(bike.supplier.id) : "",
      });
    }
  }, [open, bike, reset]);

  const statusOptions = useMemo(() => {
    const current = bike?.status as BikeStatus;
    const allowed = ALLOWED_TRANSITIONS[current] || [];
    return Array.from(new Set([current, ...allowed]));
  }, [bike?.status]);

  const onSubmit = async (data: UpdateBikeSchemaFormData) => {
    try {
      await onUpdate(data);
      setOpen(false);
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  const isRestricted = bike?.status === "BOOKED";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2 border-primary/20 hover:bg-primary/5">
          <Edit className="h-4 w-4" />
          Cập nhật xe
        </Button>
      </DialogTrigger>
      
      {/* Tăng max-width để layout không bị chật */}
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Cập nhật xe #{bike?.bikeNumber}</DialogTitle>
          <DialogDescription>Điều chỉnh thông tin kỹ thuật và vị trí của xe.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          {/* Grid Layout thoáng hơn với gap-6 */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            
            {/* Trạm xe */}
            <div className="space-y-2">
              <Label className="text-sm font-bold">Trạm hiện tại</Label>
              <Controller
                name="stationId"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <SelectTrigger className="pl-10 w-full">
                        <SelectValue placeholder="Chọn trạm" />
                      </SelectTrigger>
                      <SelectContent>
                        {stations?.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
              {errors.stationId && <p className="text-[10px] text-destructive font-medium">{errors.stationId.message}</p>}
            </div>

            {/* Nhà cung cấp */}
            <div className="space-y-2">
              <Label className="text-sm font-bold">Nhà cung cấp</Label>
              <Controller
                name="supplierId"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <SelectTrigger className="pl-10 w-full">
                        <SelectValue placeholder="Chọn NCC" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers?.map((sup) => (
                          <SelectItem key={sup.id} value={String(sup.id)}>
                            {sup.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
              {errors.supplierId && <p className="text-[10px] text-destructive font-medium">{errors.supplierId.message}</p>}
            </div>
          </div>

          {/* Trạng thái - Để full width cho dễ đọc */}
          <div className="space-y-2">
            <Label className="text-sm font-bold">Trạng thái kỹ thuật</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <Activity className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={isRestricted}
                  >
                    <SelectTrigger className="pl-10 h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          <div className="flex items-center gap-2">
                            <span className={cn("h-2.5 w-2.5 rounded-full", STATUS_CONFIG[status]?.color)} />
                            <span className="font-medium">{STATUS_CONFIG[status]?.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
            {isRestricted && (
              <div className="flex items-start gap-2 text-[11px] font-medium text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-100 mt-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Xe đang có khách thuê hoặc đặt trước, không thể thay đổi trạng thái kỹ thuật lúc này.</span>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t mt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isUpdating}>
              Hủy bỏ
            </Button>
            <Button type="submit" disabled={isUpdating} className="min-w-[140px] font-semibold">
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Xác nhận lưu"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
"use client";

import { useState, useMemo } from "react";
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
  suppliers: Supplier[]; // Thêm prop này
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

  const statusOptions = useMemo(() => {
    const current = bike.status as BikeStatus;
    const allowed = ALLOWED_TRANSITIONS[current] || [];
    return Array.from(new Set([current, ...allowed]));
  }, [bike.status]);

  const {
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<UpdateBikeSchemaFormData>({
    resolver: zodResolver(updateBikeSchema),
    defaultValues: {
      stationId: bike.station?.id || "",
      status: bike.status as BikeStatus,
      supplierId: bike.supplier?.id || "",
    },
  });

  const onSubmit = async (data: UpdateBikeSchemaFormData) => {
    try {
      await onUpdate(data);
      setOpen(false);
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      reset({
        stationId: bike.station?.id || "",
        status: bike.status as BikeStatus,
        supplierId: bike.supplier?.id || "",
      });
    }
    setOpen(newOpen);
  };

  const isRestricted = bike.status === "BOOKED";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary">
          <Edit className="h-4 w-4" />
          Cập nhật xe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            Cập nhật xe #{bike.bikeNumber}
          </DialogTitle>
          <DialogDescription>
            Điều chỉnh thông tin kỹ thuật và vị trí của xe đạp.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Trạm xe */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Trạm hiện tại</Label>
              <Controller
                name="stationId"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Chọn trạm" />
                      </SelectTrigger>
                      <SelectContent>
                        {stations.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
              {errors.stationId && <p className="text-[11px] text-destructive">{errors.stationId.message}</p>}
            </div>

            {/* Nhà cung cấp */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Nhà cung cấp</Label>
              <Controller
                name="supplierId"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Chọn NCC" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((sup) => (
                          <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
              {errors.supplierId && <p className="text-[11px] text-destructive">{errors.supplierId.message}</p>}
            </div>
          </div>

          {/* Trạng thái */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Trạng thái kỹ thuật</Label>
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
                    <SelectTrigger className="pl-10 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${STATUS_CONFIG[status]?.color}`} />
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
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600 bg-amber-50 p-2 rounded-md border border-amber-100">
                <AlertCircle className="h-3.5 w-3.5" />
                Xe đang có lịch trình (Thuê/Đặt), không thể thay đổi trạng thái.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t mt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isUpdating}>
              Đóng
            </Button>
            <Button type="submit" disabled={isUpdating} className="min-w-[130px] gradient-primary">
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang cập nhật
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
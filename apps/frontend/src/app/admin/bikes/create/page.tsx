"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bike, MapPin, Building2, Activity } from "lucide-react";
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
import { bikeSchema, BikeSchemaFormData } from "@/schemas/bike-schema";
import { useBikeActions } from "@/hooks/use-bike";
import { useStationActions } from "@/hooks/use-station";
import { useSupplierActions } from "@/hooks/use-supplier";
import { BikeStatus } from "@/types";

const BIKE_STATUS_LABELS: Record<BikeStatus, string> = {
  AVAILABLE: "Có sẵn",
  BOOKED: "Đã đặt",
  BROKEN: "Hỏng",
  RESERVED: "Đã đặt trước",
  MAINTENANCE: "Bảo trì",
  UNAVAILABLE: "Không khả dụng",
  "": "Không xác định",
};
const VALID_STATUSES: BikeStatus[] = [
  "AVAILABLE",
  "BOOKED",
  "BROKEN",
  "MAINTENANCE",
  "UNAVAILABLE",
];

export default function CreateBikePage() {
  const router = useRouter();
  const { createBike } = useBikeActions({ hasToken: true });
  const { stations } = useStationActions({ hasToken: true });
  const { allSupplier } = useSupplierActions({ hasToken: true });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BikeSchemaFormData>({
    resolver: zodResolver(bikeSchema),
    defaultValues: {
      chipId: "",
      stationId: undefined,
      supplierId: undefined,
      status: "AVAILABLE",
    },
  });

  const selectedStatus = watch("status");

  const onSubmit = async (data: BikeSchemaFormData) => {
    await createBike({
      ...data,
      supplierId: data.supplierId || undefined,
    });
    router.push("/admin/bikes");
    router.refresh();
    
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Button
          variant="ghost"
          className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại danh sách
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Bike className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Thêm xe đạp mới
              </h1>
              <p className="text-sm text-muted-foreground">
                Điều thông tin để tạo xe đạp vào hệ thống quản lý
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 rounded-lg border bg-card p-6 shadow-sm"
        >
          {/* Chip ID Field */}
          <div className="space-y-2">
            <Label htmlFor="chipId" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Chip ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="chipId"
              {...register("chipId")}
              placeholder="Nhập mã chip của xe đạp"
              className={errors.chipId ? "border-red-500" : ""}
            />
            {errors.chipId && (
              <p className="text-sm font-medium text-red-500">
                {errors.chipId.message}
              </p>
            )}
          </div>

          {/* Station Selection */}
          <div className="space-y-2">
            <Label htmlFor="stationId" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Trạm xe <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch("stationId") || ""}
              onValueChange={(value) =>
                setValue("stationId", value, { shouldValidate: true })
              }
            >
              <SelectTrigger
                id="stationId"
                className={errors.stationId ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Chọn trạm xe" />
              </SelectTrigger>
              <SelectContent>
                {stations && stations.length > 0 ? (
                  stations.map((station) => (
                    <SelectItem key={station.id} value={station.id}>
                      <div className="flex flex-col">
                        <span>{station.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {station.address}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-stations" disabled>
                    Không có trạm nào
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {errors.stationId && (
              <p className="text-sm font-medium text-red-500">
                {errors.stationId.message}
              </p>
            )}
          </div>

          {/* Supplier Selection */}
          <div className="space-y-2">
            <Label htmlFor="supplierId" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Nhà cung cấp
            </Label>
            <Select
              value={watch("supplierId") || ""}
              onValueChange={(value) =>
                setValue(
                  "supplierId",
                  value === "no-supplier" ? undefined : value,
                  { shouldValidate: true },
                )
              }
            >
              <SelectTrigger
                id="supplierId"
                className={errors.supplierId ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Chọn nhà cung cấp (không bắt buộc)" />
              </SelectTrigger>
              <SelectContent>
                {allSupplier?.data && allSupplier.data.length > 0 ? (
                  allSupplier.data.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-supplier" disabled>
                    Không có nhà cung cấp nào
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {errors.supplierId && (
              <p className="text-sm font-medium text-red-500">
                {errors.supplierId.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Để trống nếu xe không thuộc nhà cung cấp nào
            </p>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Trạng thái <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedStatus}
              onValueChange={(value: BikeStatus) =>
                setValue("status", value, { shouldValidate: true })
              }
            >
              <SelectTrigger
                id="status"
                className={errors.status ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {VALID_STATUSES.filter((status) => status === "AVAILABLE").map(
                  (status) => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        {BIKE_STATUS_LABELS[status]}
                      </div>
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm font-medium text-red-500">
                {errors.status.message}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Đang xử lý..." : "Tạo xe đạp"}
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

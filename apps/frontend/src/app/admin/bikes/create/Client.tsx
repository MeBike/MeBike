"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Bike, 
  MapPin, 
  Building2, 
  Activity, 
  Loader2,
  Building,
  Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@components/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectScrollUpButton,
  SelectScrollDownButton,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select";
import { bikeSchema, BikeSchemaFormData } from "@/schemas/bike-schema";
import type { BikeStatus, Station, Supplier } from "@/types";

const BIKE_STATUS_LABELS: Record<BikeStatus, string> = {
  AVAILABLE: "Có sẵn",
  BOOKED: "Đã đặt",
  BROKEN: "Hỏng",
  RESERVED: "Đã đặt trước",
  MAINTENANCE: "Bảo trì",
  UNAVAILABLE: "Không khả dụng",
  DISABLED: "Hư",
  LOST: "Mất xe",
  PENDING_DISPATCH: "Đang điều phối",
  TRANSPORTING : "Đang vận chuyển",
  SWAPPING : "Hỗ trợ sự cố",
  FIXED : "Đã sửa",
  "": "Không xác định",
};

const VALID_STATUSES: BikeStatus[] = [
  "AVAILABLE",
  "BOOKED",
  "BROKEN",
  "MAINTENANCE",
  "UNAVAILABLE",
];

interface CreateBikeClientProps {
  onSubmitBike: (data: BikeSchemaFormData) => Promise<void>;
  stations: Station[] | null;
  suppliers: Supplier[] | undefined;
}

export default function CreateBikeClient({
  onSubmitBike,
  stations,
  suppliers,
}: CreateBikeClientProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BikeSchemaFormData>({
    resolver: zodResolver(bikeSchema),
    defaultValues: {
      stationId: "",
      supplierId: "",
      status: "AVAILABLE",
    },
  });

  const onSubmit = async (data: BikeSchemaFormData) => {
    try {
      await onSubmitBike(data);
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  };

  // Phân loại trạm xe
  const internalStations = stations?.filter((s) => s.stationType === "INTERNAL") || [];
  const agencyStations = stations?.filter((s) => s.stationType === "AGENCY") || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Thêm xe đạp mới"
        description="Điền thông tin để tạo xe đạp vào hệ thống quản lý"
        backLink="/admin/bikes"
      />

      <Card className="mx-auto max-w-4xl border-border/50 shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground border-b border-border/50 pb-3">
                <Bike className="h-5 w-5 text-primary" />
                Thông tin xe đạp
              </h3>

              <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
                {/* Station Selection (Cải tiến giao diện) */}
                <div className="space-y-2">
                  <Label htmlFor="stationId" className="font-semibold text-muted-foreground">
                    Trạm xe <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                    <Controller
                      name="stationId"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                          <SelectTrigger className={`pl-10 ${errors.stationId ? "border-destructive focus-visible:ring-destructive" : ""}`}>
                            <SelectValue placeholder="Chọn trạm xe..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-72 overflow-y-auto">
                            <SelectScrollUpButton />
                            
                            {!stations || stations.length === 0 ? (
                              <SelectItem value="no-stations" disabled>Không có trạm nào</SelectItem>
                            ) : (
                              <>
                                {/* Group: Trạm Nội Bộ */}
                                {internalStations.length > 0 && (
                                  <SelectGroup>
                                    <SelectLabel className="flex items-center gap-2 text-primary bg-muted/50 py-2">
                                      <Building className="h-4 w-4" /> Trạm Nội Bộ (Internal)
                                    </SelectLabel>
                                    {internalStations.map((station) => (
                                      <SelectItem key={station.id} value={station.id} disabled={station.capacity.emptyPhysicalSlots <= 0}>
                                        <div className="flex flex-col gap-0.5">
                                          <span className="font-medium text-sm">{station.name}</span>
                                           <span className={`text-xs ${station.returnSlots.available > 0 ? "text-muted-foreground" : "text-destructive font-medium"}`}>
                                            {station.returnSlots.available > 0 
                                              ? `Còn ${station.returnSlots.available} chỗ trống` 
                                              : "Đã hết chỗ trống"}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                )}

                                {internalStations.length > 0 && agencyStations.length > 0 && (
                                  <SelectSeparator className="my-2" />
                                )}

                                {/* Group: Trạm Đại Lý */}
                                {agencyStations.length > 0 && (
                                  <SelectGroup>
                                    <SelectLabel className="flex items-center gap-2 text-orange-500 bg-muted/50 py-2">
                                      <Store className="h-4 w-4" /> Trạm Đại Lý
                                    </SelectLabel>
                                    {agencyStations.map((station) => (
                                      <SelectItem key={station.id} value={station.id} disabled={station.capacity.emptyPhysicalSlots <= 0}>
                                        <div className="flex flex-col gap-0.5">
                                          <span className="font-medium text-sm">{station.name}</span>
                                          <span className={`text-xs ${station.capacity.emptyPhysicalSlots > 0 ? "text-muted-foreground" : "text-destructive font-medium"}`}>
                                            {station.capacity.emptyPhysicalSlots > 0 
                                              ? `Còn ${station.returnSlots.available} chỗ trống` 
                                              : "Đã hết chỗ trống"}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                )}
                              </>
                            )}
                            <SelectScrollDownButton />
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  {errors.stationId && <p className="text-xs font-medium text-destructive">{errors.stationId.message}</p>}
                </div>

                {/* Supplier Selection */}
                <div className="space-y-2">
                  <Label htmlFor="supplierId" className="font-semibold text-muted-foreground">
                    Nhà cung cấp <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                    <Controller
                      name="supplierId"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                          <SelectTrigger className={`pl-10 ${errors.supplierId ? "border-destructive focus-visible:ring-destructive" : ""}`}>
                            <SelectValue placeholder="Chọn nhà cung cấp" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            <SelectScrollUpButton />
                            {suppliers && suppliers.length > 0 ? (
                              suppliers.map((supplier) => (
                                <SelectItem key={supplier.id} value={supplier.id}>
                                  {supplier.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-supplier" disabled>Không có nhà cung cấp nào</SelectItem>
                            )}
                            <SelectScrollDownButton />
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  {errors.supplierId && <p className="text-xs font-medium text-destructive">{errors.supplierId.message}</p>}
                </div>

                {/* Status Selection */}
                <div className="space-y-2">
                  <Label htmlFor="status" className="font-semibold text-muted-foreground">
                    Trạng thái <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Activity className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                          <SelectTrigger className={`pl-10 ${errors.status ? "border-destructive focus-visible:ring-destructive" : ""}`}>
                            <SelectValue placeholder="Chọn trạng thái" />
                          </SelectTrigger>
                          <SelectContent>
                            {VALID_STATUSES.filter((status) => status === "AVAILABLE").map((status) => (
                              <SelectItem key={status} value={status}>
                                <div className="flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-green-500" />
                                  {BIKE_STATUS_LABELS[status]}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  {errors.status && <p className="text-xs font-medium text-destructive">{errors.status.message}</p>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-6 border-t border-border/50">
              <Button type="submit" disabled={isSubmitting} className="min-w-[150px] gradient-primary shadow-glow">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Tạo xe đạp"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => router.back()}
              >
                Hủy bỏ
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
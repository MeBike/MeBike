"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  Leaf,
  FileText,
  Gauge,
  Cloud,
  ShieldCheck,
  Clock,
  Activity,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@components/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreateEnvironmentPolicySchema,
  type CreateEnvironmentPolicyInput,
} from "@/schemas/environment-policy-schema";

interface CreateEnvironmentPolicyClientProps {
  onSubmitPolicy: (data: CreateEnvironmentPolicyInput) => Promise<void>;
}

export default function CreateEnvironmentPolicyClient({
  onSubmitPolicy,
}: CreateEnvironmentPolicyClientProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateEnvironmentPolicyInput>({
    resolver: zodResolver(CreateEnvironmentPolicySchema),
    defaultValues: {
      name: "",
      average_speed_kmh: 15,
      co2_saved_per_km: 0,
      confidence_factor: 1,
      return_scan_buffer_minutes: 5,
      status: "INACTIVE",
    },
  });

  const onSubmit = async (data: CreateEnvironmentPolicyInput) => {
    try {
      await onSubmitPolicy(data);
      router.back();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Thêm chính sách môi trường mới"
        description="Thiết lập các thông số về tiết kiệm năng lượng và khí thải"
        backLink="/admin/environment-policy"
      />

      <Card className="mx-auto max-w-4xl border-border/50 shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground border-b border-border/50 pb-3">
                <Leaf className="h-5 w-5 text-primary" />
                Thông số chính sách
              </h3>

              <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
                {/* Name */}
                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="name"
                    className="font-semibold text-muted-foreground"
                  >
                    Tên chính sách <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                    <Input
                      id="name"
                      placeholder="VD: Chính sách giảm thải CO2 nội khu"
                      className={`pl-10 ${errors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      {...register("name")}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs font-medium text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Average Speed */}
                <div className="space-y-2">
                  <Label
                    htmlFor="average_speed_kmh"
                    className="font-semibold text-muted-foreground"
                  >
                    Tốc độ trung bình (km/h){" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Gauge className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                    <Input
                      id="average_speed_kmh"
                      type="number"
                      step="0.1"
                      placeholder="VD: 15"
                      className={`pl-10 ${errors.average_speed_kmh ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      {...register("average_speed_kmh", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  {errors.average_speed_kmh && (
                    <p className="text-xs font-medium text-destructive">
                      {errors.average_speed_kmh.message}
                    </p>
                  )}
                </div>

                {/* CO2 Saved Per Km */}
                <div className="space-y-2">
                  <Label
                    htmlFor="co2_saved_per_km"
                    className="font-semibold text-muted-foreground"
                  >
                    CO2 tiết kiệm (g/km){" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Cloud className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                    <Input
                      id="co2_saved_per_km"
                      type="number"
                      step="1"
                      placeholder="VD: 150"
                      className={`pl-10 ${errors.co2_saved_per_km ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      {...register("co2_saved_per_km", { valueAsNumber: true })}
                    />
                  </div>
                  {errors.co2_saved_per_km && (
                    <p className="text-xs font-medium text-destructive">
                      {errors.co2_saved_per_km.message}
                    </p>
                  )}
                </div>

                {/* Confidence Factor */}
                <div className="space-y-2">
                  <Label
                    htmlFor="confidence_factor"
                    className="font-semibold text-muted-foreground"
                  >
                    Hệ số tin cậy (0 - 1){" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                    <Input
                      id="confidence_factor"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      placeholder="VD: 0.95"
                      className={`pl-10 ${errors.confidence_factor ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      {...register("confidence_factor", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  {errors.confidence_factor && (
                    <p className="text-xs font-medium text-destructive">
                      {errors.confidence_factor.message}
                    </p>
                  )}
                </div>

                {/* Return Scan Buffer Minutes */}
                <div className="space-y-2">
                  <Label
                    htmlFor="return_scan_buffer_minutes"
                    className="font-semibold text-muted-foreground"
                  >
                    Thời gian đệm trả xe (phút)
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                    <Input
                      id="return_scan_buffer_minutes"
                      type="number"
                      step="1"
                      placeholder="VD: 5"
                      className={`pl-10 ${errors.return_scan_buffer_minutes ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      {...register("return_scan_buffer_minutes", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  {errors.return_scan_buffer_minutes && (
                    <p className="text-xs font-medium text-destructive">
                      {errors.return_scan_buffer_minutes.message}
                    </p>
                  )}
                </div>

                {/* Status Selection */}
                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="status"
                    className="font-semibold text-muted-foreground"
                  >
                    Trạng thái <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative md:w-1/2 pr-0 md:pr-3">
                    <Activity className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <SelectTrigger
                            className={`pl-10 ${errors.status ? "border-destructive focus-visible:ring-destructive" : ""}`}
                          >
                            <SelectValue placeholder="Chọn trạng thái" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-green-500" />
                                Đang hoạt động
                              </div>
                            </SelectItem>
                            <SelectItem value="INACTIVE">
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-slate-400" />
                                Vô hiệu hóa
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  {errors.status && (
                    <p className="text-xs font-medium text-destructive">
                      {errors.status.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-6 border-t border-border/50">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[150px] gradient-primary shadow-glow"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  "Tạo chính sách"
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

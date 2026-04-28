"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { MapPin, Activity, Loader2, Users, Wrench } from "lucide-react";
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
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "@/components/ui/select";
import { createTechnicianTeamSchema, CreateTechnicianTeamSchema } from "@/schemas/technician-schema";
import type { Station } from "@/types";

const TEAM_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Khả dụng",
  UNAVAILABLE: "Không khả dụng",
};

const VALID_STATUSES = ["AVAILABLE", "UNAVAILABLE"] as const;

interface CreateTechnicianTeamClientProps {
  onSubmitTeam: (data: CreateTechnicianTeamSchema) => Promise<any>;
  stations: Station[] | null;
}

export default function CreateTechnicianTeamClient({
  onSubmitTeam,
  stations,
}: CreateTechnicianTeamClientProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateTechnicianTeamSchema>({
    resolver: zodResolver(createTechnicianTeamSchema),
    defaultValues: {
      name: "",
      stationId: "",
      availabilityStatus: "AVAILABLE",
    },
  });

  const onSubmit = async (data: CreateTechnicianTeamSchema) => {
    try {
      await onSubmitTeam(data);
      router.push("/admin/technician-teams");
      router.refresh();
    } catch (error) {
      console.error("Lỗi khi tạo đội kỹ thuật:", error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Thêm đội kỹ thuật mới"
        description="Điền thông tin để tạo đội kỹ thuật vào hệ thống quản lý"
        backLink="/admin/technician-teams"
      />

      <Card className="mx-auto max-w-4xl border-border/50 shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground border-b border-border/50 pb-3">
                <Wrench className="h-5 w-5 text-primary" />
                Thông tin đội kỹ thuật
              </h3>

              <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
                {/* Tên đội kỹ thuật (Bắt buộc) */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-semibold text-muted-foreground">
                    Tên đội kỹ thuật <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                    <Input
                      id="name"
                      placeholder="Nhập tên đội..."
                      className={`pl-10 ${errors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      {...register("name")}
                    />
                  </div>
                  {errors.name && <p className="text-xs font-medium text-destructive">{errors.name.message}</p>}
                </div>

                {/* Station Selection (Bắt buộc) */}
                <div className="space-y-2">
                  <Label htmlFor="stationId" className="font-semibold text-muted-foreground">
                    Trạm quản lý <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                    <Controller
                      name="stationId"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                          <SelectTrigger className={`pl-10 ${errors.stationId ? "border-destructive focus-visible:ring-destructive" : ""}`}>
                            <SelectValue placeholder="Chọn trạm xe" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            <SelectScrollUpButton />
                            {stations && stations.length > 0 ? (
                              stations.map((station) => (
                                <SelectItem key={station.id} value={station.id}>
                                  {station.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-stations" disabled>Không có trạm nào</SelectItem>
                            )}
                            <SelectScrollDownButton />
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  {errors.stationId && <p className="text-xs font-medium text-destructive">{errors.stationId.message}</p>}
                </div>

                {/* Status Selection (Mặc định AVAILABLE) */}
                <div className="space-y-2">
                  <Label htmlFor="availabilityStatus" className="font-semibold text-muted-foreground">
                    Trạng thái hoạt động <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Activity className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                    <Controller
                      name="availabilityStatus"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                          <SelectTrigger className={`pl-10 ${errors.availabilityStatus ? "border-destructive focus-visible:ring-destructive" : ""}`}>
                            <SelectValue placeholder="Chọn trạng thái" />
                          </SelectTrigger>
                          <SelectContent>
                            {VALID_STATUSES.map((status) => (
                              <SelectItem key={status} value={status}>
                                <div className="flex items-center gap-2">
                                  <span className={`h-2 w-2 rounded-full ${status === "AVAILABLE" ? "bg-green-500" : "bg-red-500"}`} />
                                  {TEAM_STATUS_LABELS[status]}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  {errors.availabilityStatus && <p className="text-xs font-medium text-destructive">{errors.availabilityStatus.message}</p>}
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
                  "Tạo đội kỹ thuật"
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
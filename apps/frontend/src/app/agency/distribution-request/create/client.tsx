"use client";

import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Repeat, Loader2 } from "lucide-react";
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
import { CreateRedistributionRequestSchema, CreateRedistributionRequestInput } from "@/schemas/distribution-request-schema";
import { CurrentStation } from "@/types";

interface CreateDistributionRequestClientProps {
  onSubmitRequest: (data: CreateRedistributionRequestInput) => Promise<void>;
  stations: CurrentStation;
}

export default function CreateDistributionRequestClient({
  onSubmitRequest,
  stations,
}: CreateDistributionRequestClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTargetStationId = searchParams.get("targetStationId") || "";

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateRedistributionRequestInput>({
    resolver: zodResolver(CreateRedistributionRequestSchema),
    defaultValues: {
      requestedQuantity: 1,
      sourceStationId: stations.currentStation.id,
      targetStationId: defaultTargetStationId,
      reason: "",
    },
  });

  const sourceStationId = useWatch({ control, name: "sourceStationId" });

  const onSubmit = async (data: CreateRedistributionRequestInput) => {
    try {
      await onSubmitRequest(data);
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Tạo yêu cầu điều phối"
        description="Điều phối xe từ trạm của bạn đến trạm đích"
        backLink="/agency/distribution-request"
      />

      <Card className="mx-auto max-w-2xl border-border/50 shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground border-b border-border/50 pb-3">
                <Repeat className="h-5 w-5 text-primary" />
                Thông tin chi tiết
              </h3>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label className="font-semibold text-muted-foreground">Trạm xuất</Label>
                  <Input 
                    value={`${stations.currentStation.name} (Trạm của bạn)`} 
                    disabled 
                    className="bg-muted"
                  />
                  <input type="hidden" {...register("sourceStationId")} value={stations.currentStation.id} />
                </div>

                {/* Target Station */}
                <div className="space-y-2">
                  <Label className="font-semibold">Trạm đích <span className="text-destructive">*</span></Label>
                  <Controller
                    name="targetStationId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className={errors.targetStationId ? "border-destructive" : ""}>
                          <SelectValue placeholder="Chọn trạm đích" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Loại bỏ trạm hiện tại khỏi danh sách chọn trạm đích */}
                          {stations.otherStations?.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.targetStationId && <p className="text-xs text-destructive">{errors.targetStationId.message}</p>}
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                  <Label className="font-semibold">Số lượng xe (1-20) <span className="text-destructive">*</span></Label>
                  <Input
                    type="number"
                    {...register("requestedQuantity", { valueAsNumber: true })}
                    placeholder="Nhập số lượng"
                  />
                  {errors.requestedQuantity && <p className="text-xs text-destructive">{errors.requestedQuantity.message}</p>}
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <Label className="font-semibold">Lý do điều phối</Label>
                  <Input {...register("reason")} placeholder="Nhập lý do..." />
                </div>
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Xác nhận gửi yêu cầu"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
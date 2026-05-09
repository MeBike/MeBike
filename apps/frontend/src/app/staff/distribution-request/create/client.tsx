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
import {
  CreateRedistributionRequestSchema,
  CreateRedistributionRequestInput,
} from "@/schemas/distribution-request-schema";
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
    setValue,
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

  // 1. Theo dõi giá trị targetStationId đang được chọn
  const targetStationId = useWatch({ control, name: "targetStationId" });

  // 2. Tìm trạm đích tương ứng trong danh sách để lấy số chỗ trống
  const selectedTargetStation = stations.otherStations?.find(
    (s) => s.id === targetStationId,
  );

  // 3. Gán giới hạn max bằng số chỗ trống của trạm đích (hoặc 0 nếu chưa chọn trạm)
  const maxAvailableSlots =
    selectedTargetStation?.operationalAvailableSlots || 0;

  const onSubmit = async (data: CreateRedistributionRequestInput) => {
    // Ép kiểu an toàn lần cuối trước khi submit phòng khi Zod schema không check max động
    if (data.requestedQuantity > maxAvailableSlots) {
      return; // Hoặc bạn có thể set error thủ công ở đây bằng setError()
    }

    try {
      await onSubmitRequest(data);
      router.push("/staff/distribution-request");
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
        backLink="/staff/distribution-request"
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
                {/* Source Station */}
                <div className="space-y-2">
                  <Label className="font-semibold text-muted-foreground">
                    Trạm xuất
                  </Label>
                  <Input
                    value={`${stations.currentStation.name} (Trạm của bạn)`}
                    disabled
                    className="bg-muted"
                  />
                  <input
                    type="hidden"
                    {...register("sourceStationId")}
                    value={stations.currentStation.id}
                  />
                </div>
                <Label>Số lượng xe hiện tại của trạm xuất : <span className="text-red-600 font-semibold">{stations.currentStation.operationalAvailableSlots}</span></Label>

                {/* Target Station */}
                <div className="space-y-2">
                  <Label className="font-semibold">
                    Trạm đích <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="targetStationId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Reset số lượng về 1 mỗi khi đổi trạm đích để tránh bị kẹt số cũ lớn hơn chỗ trống
                          setValue("requestedQuantity", 1);
                        }}
                        value={field.value}
                      >
                        <SelectTrigger
                          className={
                            errors.targetStationId ? "border-destructive" : ""
                          }
                        >
                          <SelectValue placeholder="Chọn trạm đích" />
                        </SelectTrigger>
                        <SelectContent>
                          {stations.otherStations?.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name} (Trống: {s.operationalAvailableSlots})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.targetStationId && (
                    <p className="text-xs text-destructive">
                      {errors.targetStationId.message}
                    </p>
                  )}
                </div>
                {/* Requested Quantity */}
                <div className="space-y-2">
                  <Label className="font-semibold text-left block">
                    Số lượng xe{" "}
                    {maxAvailableSlots > 0 ? `(1-${maxAvailableSlots})` : ""}
                    <span className="text-destructive ml-1">*</span>
                  </Label>

                  {selectedTargetStation && (
                    <p className="text-sm text-muted-foreground">
                      Chỗ còn trống tại trạm đích:{" "}
                      <span className="font-semibold text-foreground text-red-600">
                        {maxAvailableSlots}
                      </span>
                    </p>
                  )}

                  <Input
                    type="number"
                    {...register("requestedQuantity", {
                      valueAsNumber: true,
                      onChange: (e) => {
                        const val = parseInt(e.target.value);
                        if (val > maxAvailableSlots) {
                          e.target.value = maxAvailableSlots.toString();
                        }
                      },
                    })}
                    placeholder="Nhập số lượng"
                    min={1}
                    max={maxAvailableSlots}
                    disabled={!selectedTargetStation || maxAvailableSlots === 0}
                  />

                  {errors.requestedQuantity && (
                    <p className="text-xs text-destructive">
                      {errors.requestedQuantity.message}
                    </p>
                  )}
                  {selectedTargetStation && maxAvailableSlots === 0 && (
                    <p className="text-xs text-destructive">
                      Trạm đích đã hết chỗ trống, vui lòng chọn trạm khác.
                    </p>
                  )}
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <Label className="font-semibold">Lý do điều phối</Label>
                  <Input {...register("reason")} placeholder="Nhập lý do..." />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || maxAvailableSlots === 0}
              className="w-full"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Xác nhận gửi yêu cầu"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

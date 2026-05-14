"use client";

import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Repeat, Loader2, Info, ArrowLeft , AlertCircle} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
import { useAgencyActions } from "@/hooks/use-agency";

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

  // Dùng hook của Agency với ID là trạm xuất (trạm của bạn)
  const { myStationDetail, getMyStationDetail, isLoadingMyAgencyStation } =
    useAgencyActions({
      station_id: stations.currentStation.id,
    });

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

  const targetStationId = useWatch({ control, name: "targetStationId" });
  const selectedTargetStation = stations.otherStations?.find(
    (s) => s.id === targetStationId,
  );
  const targetAvailableSlots =
    selectedTargetStation?.operationalAvailableSlots || 0;
  const sourceAvailableBikes = myStationDetail?.bikes?.available || 0;
  const maxLimit = Math.min(targetAvailableSlots, sourceAvailableBikes);
  const onSubmit = async (data: CreateRedistributionRequestInput) => {
    if (data.requestedQuantity > maxLimit) {
      return;
    }
    try {
      await onSubmitRequest(data);
      router.push("/agency/distribution-request");
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  };

   return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Tạo yêu cầu điều phối
          </h1>
          <p className="text-sm text-muted-foreground">
            Điều phối xe từ trạm của bạn đến trạm đích
          </p>
        </div>
      </div>

      <Card className="">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground border-b border-border/50 pb-3">
                <Repeat className="h-5 w-5 text-primary" />
                Thông tin chi tiết
              </h3>

              <div className="grid grid-cols-1 gap-6">
                {/* Source Station */}
                <div className="space-y-3">
                  <Label className="font-semibold text-muted-foreground">
                    Trạm xuất (Trạm của bạn)
                  </Label>
                  <Input
                    value={stations.currentStation.name}
                    disabled
                    className="bg-muted font-medium"
                  />
                  <input
                    type="hidden"
                    {...register("sourceStationId")}
                    value={stations.currentStation.id}
                  />

                  {/* Hiển thị chi tiết số lượng xe từ myStationDetail */}
                  {myStationDetail?.bikes && (
                    <div className="bg-muted/30 p-4 rounded-xl border border-border/50 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Info className="h-4 w-4 text-primary" />
                        Tình trạng xe tại trạm xuất
                      </div>

                      {/* Đổi thành dạng Card Grid nhỏ */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        <div className="bg-background rounded-lg border border-border/50 p-3 flex flex-col gap-1 shadow-sm">
                          <span className="text-xs text-muted-foreground font-medium">
                            Tổng xe
                          </span>
                          <span className="font-semibold text-base">
                            {myStationDetail.bikes.total}
                          </span>
                        </div>

                        {/* Ô SẴN SÀNG: Thêm cảnh báo đỏ nếu < 10 */}
                        <div className="bg-background rounded-lg border border-border/50 p-3 flex flex-col gap-1 shadow-sm relative">
                          <span className="text-xs text-muted-foreground font-medium">
                            Sẵn sàng
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold text-base ${
                                sourceAvailableBikes < 10
                                  ? "text-destructive"
                                  : "text-green-600"
                              }`}
                            >
                              {myStationDetail.bikes.available}
                            </span>
                            {sourceAvailableBikes < 10 && (
                              <span className="bg-destructive/10 text-destructive text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                Không đủ
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="bg-background rounded-lg border border-border/50 p-3 flex flex-col gap-1 shadow-sm">
                          <span className="text-xs text-muted-foreground font-medium">
                            Đang được thuê
                          </span>
                          <span className="font-semibold text-base text-blue-600">
                            {myStationDetail.bikes.booked}
                          </span>
                        </div>

                        <div className="bg-background rounded-lg border border-border/50 p-3 flex flex-col gap-1 shadow-sm">
                          <span className="text-xs text-muted-foreground font-medium">
                            Đã đặt trước
                          </span>
                          <span className="font-semibold text-base text-orange-500">
                            {myStationDetail.bikes.reserved}
                          </span>
                        </div>

                        <div className="bg-background rounded-lg border border-border/50 p-3 flex flex-col gap-1 shadow-sm">
                          <span className="text-xs text-muted-foreground font-medium">
                            Bị hỏng
                          </span>
                          <span className="font-semibold text-base text-destructive">
                            {myStationDetail.bikes.broken}
                          </span>
                        </div>

                        <div className="bg-background rounded-lg border border-border/50 p-3 flex flex-col gap-1 shadow-sm">
                          <span className="text-xs text-muted-foreground font-medium">
                            Đang điều phối
                          </span>
                          <span className="font-semibold text-base text-orange-500">
                            {myStationDetail.bikes.redistributing}
                          </span>
                        </div>
                        <div className="bg-background rounded-lg border border-border/50 p-3 flex flex-col gap-1 shadow-sm">
                          <span className="text-xs text-muted-foreground font-medium">
                            Tạm ngưng hoạt động
                          </span>
                          <span className="font-semibold text-base text-grey-500">
                            {myStationDetail.bikes.disabled}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

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
                              {s.name} (Chỗ trống: {s.operationalAvailableSlots}
                              )
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
                    Số lượng xe cần điều phối{" "}
                    <span className="text-destructive ml-1">
                      {maxLimit > 0 ? `(Tối đa: ${maxLimit})` : ""}
                    </span>
                  </Label>

                  {selectedTargetStation && (
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        Chỗ trống tại trạm đích:{" "}
                        <span className="font-semibold text-red-600">
                          {targetAvailableSlots}
                        </span>
                      </p>
                      <p>
                        Xe khả dụng tại trạm xuất:{" "}
                        <span className="font-semibold text-red-600">
                          {sourceAvailableBikes}
                        </span>
                      </p>
                    </div>
                  )}

                  <Input
                    type="number"
                    {...register("requestedQuantity", {
                      valueAsNumber: true,
                      onChange: (e) => {
                        const val = parseInt(e.target.value);
                        if (val > maxLimit) {
                          e.target.value = maxLimit.toString();
                        }
                      },
                    })}
                    placeholder="Nhập số lượng"
                    min={1}
                    max={maxLimit}
                    disabled={!selectedTargetStation || maxLimit === 0}
                  />

                  {errors.requestedQuantity && (
                    <p className="text-xs text-destructive">
                      {errors.requestedQuantity.message}
                    </p>
                  )}
                  {selectedTargetStation && targetAvailableSlots === 0 && (
                    <p className="text-xs text-destructive">
                      Trạm đích đã hết chỗ trống.
                    </p>
                  )}
                  {selectedTargetStation && sourceAvailableBikes === 0 && (
                    <p className="text-xs text-destructive">
                      Trạm xuất không còn xe khả dụng để điều phối.
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

            <div className="space-y-4">
              {/* CẢNH BÁO KHI TRẠM XUẤT CÓ < 10 XE */}
              {sourceAvailableBikes < 10 && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>
                    Không thể gửi yêu cầu. Trạm xuất cần có ít nhất{" "}
                    <strong>10 xe khả dụng</strong> để thực hiện điều phối.
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  maxLimit === 0 ||
                  !selectedTargetStation ||
                  sourceAvailableBikes < 10
                }
                className="w-full"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Xác nhận gửi yêu cầu"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

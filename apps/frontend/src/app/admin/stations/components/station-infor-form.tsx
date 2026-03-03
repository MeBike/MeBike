"use client";

import { UseFormReturn } from "react-hook-form";
import { StationSchemaFormData } from "@/schemas/stationSchema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface StationInfoFormProps {
  form: UseFormReturn<StationSchemaFormData>;
  onSubmit: (data: StationSchemaFormData) => void;
  onCancel: () => void;
}

export function StationInfoForm({ form, onSubmit, onCancel }: StationInfoFormProps) {
  const { register, formState: { errors, isSubmitting } } = form;

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-muted/30 px-6 py-5">
        <h2 className="text-lg font-semibold">Thông tin trạm</h2>
      </div>

      <div className="px-6 py-6 space-y-5">
        <FormField label="Tên trạm" error={errors.name?.message} required>
          <Input {...register("name")} placeholder="Nhập tên trạm" className="h-11" />
        </FormField>

        <FormField label="Địa chỉ" error={errors.address?.message} required>
          <Input {...register("address")} placeholder="Nhập địa chỉ" className="h-11" />
        </FormField>

        <FormField label="Sức chứa" error={errors.capacity?.message} required>
          <Input type="number" {...register("capacity", { valueAsNumber: true })} className="h-11" />
        </FormField>

        <div className="border-t pt-5 space-y-4">
          <p className="text-sm font-semibold">Tọa độ vị trí</p>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Lat">
              <Input {...register("latitude")} readOnly className="bg-muted/50" />
            </FormField>
            <FormField label="Long">
              <Input {...register("longitude")} readOnly className="bg-muted/50" />
            </FormField>
          </div>
        </div>

        <div className="flex gap-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Hủy</Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : "Tạo trạm"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, error, required, children }: any) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
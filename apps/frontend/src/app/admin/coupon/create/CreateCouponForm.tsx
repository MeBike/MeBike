"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@components/PageHeader";
import {Loader2 } from "lucide-react";
import { useCoupon } from "@/hooks/use-coupon";

// Định nghĩa các tier cố định
const COUPON_TIERS = [
  { label: "60 phút - Giảm 1.000đ", min: 60, val: 1000 },
  { label: "120 phút - Giảm 2.000đ", min: 120, val: 2000 },
  { label: "240 phút - Giảm 4.000đ", min: 240, val: 4000 },
  { label: "360 phút - Giảm 6.000đ", min: 360, val: 6000 },
];

const Schema = z.object({
  name: z.string().min(1, "Tên bắt buộc"),
  tier: z.string().min(1, "Vui lòng chọn gói ưu đãi"),
  activeFrom: z.string().optional(),
  activeTo: z.string().optional(),
});

export default function CreateCouponForm() {
  const { createCoupon } = useCoupon({ hasToken: true });
  const today = new Date().toISOString().split('T')[0];
  const form = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
  });
  const onSubmit = async (data: z.infer<typeof Schema>) => {
    const selectedTier = COUPON_TIERS.find(t => t.label === data.tier);
    if (!selectedTier) return;
    const payload = {
      name: data.name,
      discountValue: selectedTier.val,
      minRidingMinutes: selectedTier.min,
      discountType: "FIXED_AMOUNT" as const,
      triggerType: "RIDING_DURATION" as const,
      status: "ACTIVE" as const,
      priority: 0,
      activeFrom: data.activeFrom ? new Date(data.activeFrom).toISOString() : null,
      activeTo: data.activeTo ? new Date(data.activeTo).toISOString() : null,
    };
    await createCoupon(payload as any);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Tạo coupon" description="Chọn gói ưu đãi cố định" backLink="/admin/coupon" />
      
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <Label>Tên coupon *</Label>
                <Input {...form.register("name")} placeholder="Nhập tên..." />
              </div>

              <div className="space-y-2">
                <Label>Chọn gói ưu đãi *</Label>
                <Controller
                  name="tier"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn mức ưu đãi" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUPON_TIERS.map((t) => (
                          <SelectItem key={t.label} value={t.label}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Ngày bắt đầu</Label>
                <Input type="date" {...form.register("activeFrom")} min={today} />
              </div>

              <div className="space-y-2">
                <Label>Ngày kết thúc</Label>
                <Input type="date" {...form.register("activeTo")} min={form.watch("activeFrom") || today} />
              </div>
            </div>

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tạo coupon
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
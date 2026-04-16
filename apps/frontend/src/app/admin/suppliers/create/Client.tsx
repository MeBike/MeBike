"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@components/PageHeader"; // Đảm bảo đúng đường dẫn của bạn
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Percent, 
  Briefcase, 
  Loader2 
} from "lucide-react";

import {
  CreateSupplierSchema,
  createSupplierSchema,
} from "@/schemas/supplier-schema";
import { AxiosResponse } from "axios";

interface CreateSupplierClientProps {
onSubmitSupplier: (data: CreateSupplierSchema) => Promise<AxiosResponse>;
}

export default function CreateSupplierClient({ onSubmitSupplier }: CreateSupplierClientProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateSupplierSchema>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: {
      name: "",
      address: "",
      phoneNumber: "",
      contractFee: 0.01,
    },
  });

  const onSubmit = async (data: CreateSupplierSchema) => {
    try {
      const result = await onSubmitSupplier(data);
      // Giả sử API trả về status 200 hoặc object kết quả thành công
      if (result?.status === 200 || result) { 
        toast.success("Tạo nhà cung cấp thành công!");
        router.push("/admin/suppliers");
      }
    } catch (err) {
      console.error("Failed to create supplier:", err);
      toast.error("Đã có lỗi xảy ra khi tạo nhà cung cấp. Vui lòng thử lại.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Tạo nhà cung cấp"
        description="Thêm thông tin đối tác/nhà cung cấp mới vào hệ thống"
        backLink="/admin/suppliers"
      />

      <Card className="mx-auto max-w-4xl border-border/50 shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            <div className="space-y-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground border-b border-border/50 pb-3">
                <Briefcase className="h-5 w-5 text-primary" />
                Thông tin nhà cung cấp
              </h3>
              
              <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
                
                {/* Field: Tên nhà cung cấp */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-semibold text-muted-foreground">
                    Tên nhà cung cấp <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="VD: Cty TNHH MeBike"
                      className={`pl-10 ${errors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs font-medium text-destructive">{errors.name.message}</p>
                  )}
                </div>

                {/* Field: Địa chỉ */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="font-semibold text-muted-foreground">
                    Địa chỉ <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="address"
                      {...register("address")}
                      placeholder="VD: Quận 1, TP.HCM"
                      className={`pl-10 ${errors.address ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                  </div>
                  {errors.address && (
                    <p className="text-xs font-medium text-destructive">{errors.address.message}</p>
                  )}
                </div>

                {/* Field: Số điện thoại */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="font-semibold text-muted-foreground">
                    Số điện thoại liên hệ <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phoneNumber"
                      {...register("phoneNumber")}
                      placeholder="Nhập số điện thoại"
                      className={`pl-10 ${errors.phoneNumber ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p className="text-xs font-medium text-destructive">{errors.phoneNumber.message}</p>
                  )}
                </div>

                {/* Field: Phí hợp đồng */}
                <div className="space-y-2">
                  <Label htmlFor="contractFee" className="font-semibold text-muted-foreground">
                    Phí hợp đồng (%)
                  </Label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="contractFee"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      {...register("contractFee", { valueAsNumber: true })}
                      placeholder="Ví dụ: 0.05 (Tương đương 5%)"
                      className={`pl-10 ${errors.contractFee ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                  </div>
                  {errors.contractFee && (
                    <p className="text-xs font-medium text-destructive">{errors.contractFee.message}</p>
                  )}
                </div>

              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-border/50">
              <Button type="submit" disabled={isSubmitting} className="min-w-[150px] gradient-primary shadow-glow">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Tạo nhà cung cấp"
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
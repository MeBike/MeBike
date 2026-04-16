"use client";

import { PageHeader } from "@components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
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
import { User, Mail, Phone, Lock, Shield, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema, type CreateUserFormData } from "@/schemas/user-schema"; 

interface CreateUserProps {
  onSubmit: ({ data }: { data: CreateUserFormData }) => void;
}

export default function CreateUser({ onSubmit }: CreateUserProps) {
  const navigate = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullname: "",
      email: "",
      phoneNumber: "",
      password: "",
      role: "USER",
    },
  });

  const onFormSubmit = (data: CreateUserFormData) => {
    console.log("Dữ liệu hợp lệ:", data);
    onSubmit({ data });
  };
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Tạo người dùng" 
        description="Tạo tài khoản người dùng"
        backLink="/admin/customers"
      />
      <Card className="mx-auto max-w-4xl border-border/50 shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
            
            <div className="space-y-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground border-b border-border/50 pb-3">
                <User className="h-5 w-5 text-primary" />
                Thông tin cơ bản
              </h3>
              
              <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
                
                {/* Field: Họ và tên */}
                <div className="space-y-2">
                  <Label htmlFor="fullname" className="font-semibold text-muted-foreground">
                    Họ và tên <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="fullname"
                      {...register("fullname")}
                      placeholder="Nhập họ và tên"
                      className={`pl-10 ${errors.fullname ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                  </div>
                  {errors.fullname && (
                    <p className="text-xs font-medium text-destructive">{errors.fullname.message}</p>
                  )}
                </div>

                {/* Field: Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-semibold text-muted-foreground">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="Nhập địa chỉ email"
                      className={`pl-10 ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs font-medium text-destructive">{errors.email.message}</p>
                  )}
                </div>

                {/* Field: Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="font-semibold text-muted-foreground">
                    Số điện thoại <span className="text-destructive">*</span>
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

                {/* Field: Mật khẩu */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-semibold text-muted-foreground">
                    Mật khẩu <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      {...register("password")}
                      placeholder="Nhập mật khẩu"
                      className={`pl-10 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs font-medium text-destructive">{errors.password.message}</p>
                  )}
                </div>

                {/* Field: Chức vụ */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="font-semibold text-muted-foreground">
                    Chức vụ <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                    <Controller
                      name="role"
                      control={control}
                      render={({ field }) => (
                        // Đã thêm value={field.value} vào Select
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value} 
                          defaultValue={field.value}
                        >
                          <SelectTrigger className={`pl-10 ${errors.role ? "border-destructive focus-visible:ring-destructive" : ""}`}>
                            <SelectValue placeholder="Chọn chức vụ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USER">Người Dùng (User)</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  {errors.role && (
                    <p className="text-xs font-medium text-destructive">{errors.role.message}</p>
                  )}
                </div>

              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-border/50">
              <Button type="submit" disabled={isSubmitting} className="min-w-[120px] gradient-primary shadow-glow">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  "Tạo nhân viên"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => navigate.push("/admin/customers")}
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
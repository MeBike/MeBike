"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, ArrowLeft, Shield, User, Key } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-providers";
import { useAuthActions } from "@/hooks/useAuthAction";
import { changePasswordSchema, ChangePasswordSchemaFormData } from "@/schemas/auth-schema";
import Link from "next/link";
import { Progress } from "@radix-ui/react-progress";

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const { changePassword } = useAuthActions();
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChangePasswordSchemaFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const onSubmit = async (data: ChangePasswordSchemaFormData) => {
    try {
      changePassword({currentPassword: data.currentPassword, newPassword: data.newPassword});
      reset();
    } catch (error) {
      console.error("Error changing password:", error);
    }
  };


  if (!user) {
    return <div className="flex items-center justify-center h-screen"><Progress /></div>;
  }

  return (
    <div>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Link
              href="/technician/profile"
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">
                Thay đổi mật khẩu
              </h1>
              <p className="text-muted-foreground mt-1">
                Cập nhật mật khẩu để bảo mật tài khoản của bạn
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái bảo mật</p>
                  <p className="font-semibold text-foreground">
                    {user.verify === "VERIFIED" ? "Đã xác thực" : "Cần xác thực"}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vai trò</p>
                  <p className="font-semibold text-foreground">Nhân viên</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
                  <Key className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lần cuối đổi</p>
                  <p className="font-semibold text-foreground">
                    {new Date(user.updatedAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Cập nhật mật khẩu
                </h2>
                <p className="text-sm text-muted-foreground">
                  Vui lòng nhập mật khẩu hiện tại và mật khẩu mới để cập nhật bảo mật tài khoản
                </p>
              </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="currentPassword"
                  className="text-sm font-medium text-foreground"
                >
                  Mật khẩu hiện tại
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.currentPassword ? "text" : "password"}
                    {...register("currentPassword")}
                    placeholder="Nhập mật khẩu hiện tại"
                    className={cn(
                      "bg-background border-border pr-10",
                      errors.currentPassword && "border-destructive"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("currentPassword")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.currentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-sm text-destructive">
                    {errors.currentPassword.message}
                  </p>
                )}
              </div>

              
              <div className="space-y-2">
                <Label
                  htmlFor="newPassword"
                  className="text-sm font-medium text-foreground"
                >
                  Mật khẩu mới
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.newPassword ? "text" : "password"}
                    {...register("newPassword")}
                    placeholder="Nhập mật khẩu mới"
                    className={cn(
                      "bg-background border-border pr-10",
                      errors.newPassword && "border-destructive"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("newPassword")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.newPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-sm text-destructive">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              
              {/* <div className="space-y-2">
                <Label
                  htmlFor="confirm_password"
                  className="text-sm font-medium text-foreground"
                >
                  Xác nhận mật khẩu mới
                </Label>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    type={showPasswords.confirmPassword ? "text" : "password"}
                    {...register("confirm_password")}
                    placeholder="Nhập lại mật khẩu mới"
                    className={cn(
                      "bg-background border-border pr-10",
                      errors.confirm_password && "border-destructive"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirmPassword")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.confirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.confirm_password && (
                  <p className="text-sm text-destructive">
                    {errors.confirm_password.message}
                  </p>
                )}
              </div> */}

              {/* Submit Button */}
              <div className="flex gap-3 pt-6 border-t border-border">
                <Link href="/technician/profile">
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-transparent"
                  >
                    Hủy
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 gap-2"
                >
                  <Lock className="w-4 h-4" />
                  {isSubmitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                </Button>
              </div>
            </form>
          </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Bảo mật tài khoản</h3>
                  <p className="text-sm text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vai trò:</span>
                  <span className="font-medium text-foreground">
                    Nhân viên
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trạng thái:</span>
                  <span className={`font-medium ${user.verify === "VERIFIED" ? "text-green-600" : "text-amber-600"}`}>
                    {user.verify === "VERIFIED" ? "Đã xác thực" : "Chưa xác thực"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lần cuối cập nhật:</span>
                  <span className="font-medium text-foreground">
                    {new Date(user.updatedAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
                  <span className="text-lg">💡</span>
                </div>
                <h4 className="font-semibold text-foreground">Lời khuyên bảo mật</h4>
              </div>
              
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Sử dụng mật khẩu mạnh với ít nhất 8 ký tự</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Không sử dụng thông tin cá nhân dễ đoán</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Thay đổi mật khẩu định kỳ để đảm bảo an toàn</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Không chia sẻ mật khẩu với bất kỳ ai</span>
                </li>
              </ul>
            </div>

            {/* Password Strength Indicator */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="text-lg">🔐</span>
                Mức độ bảo mật
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Yếu</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Trung bình</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Mạnh</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Mật khẩu mạnh giúp bảo vệ tài khoản khỏi các cuộc tấn công mạng
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
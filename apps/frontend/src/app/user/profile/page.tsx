"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DetailUser } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Save, X, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-providers";
import { Progress } from "@radix-ui/react-progress";
import { useAuthActions } from "@/hooks/useAuthAction";
import Image from "next/image";
import { UpdateProfileSchemaFormData } from "@/schemas/authSchema";
import Link from "next/link";
export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [data, setData] = useState<DetailUser | null>(null);
  const [formData, setFormData] = useState<DetailUser>(
    () => user || ({} as DetailUser)
  );
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar ?? "");
  const { resendVerifyEmail } = useAuthActions();
  useEffect(() => {
    if (user) {
      setData(user);
      setFormData(user as DetailUser);
      setAvatarPreview(user.avatar ?? "");
      console.log(user);
    }
  }, [user]);
  if (!user || !data) {
    return (
      <div>
        <Progress />
      </div>
    );
  }
  const handleInputChange = (field: keyof DetailUser, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSave = () => {
    if (!user) return;
    const fields: (keyof UpdateProfileSchemaFormData)[] = [
      "fullname",
      "username",
      "phone_number",
      "location",
      "avatar",
    ];

    const updatedData = fields.reduce((acc, field) => {
      const newValue = field === "avatar" ? avatarPreview : formData[field];
      const oldValue = user[field as keyof DetailUser] ?? "";

      if (newValue !== oldValue) {
        acc[field] = newValue || "";
      }
      return acc;
    }, {} as UpdateProfileSchemaFormData);

    // Nếu có field nào thay đổi mới gọi API
    if (Object.keys(updatedData).length > 0) {
      updateProfile(updatedData);
    }

    setIsEditing(false);
  };

  const handleCancel = () => {
    if (data) {
      setFormData(data as DetailUser);
      setAvatarPreview(data.avatar || "");
    }
    setIsEditing(false);
  };
  const handleResendVerifyEmail = () => {
    if (formData?.verify === "VERIFIED") {
      return;
    }
    resendVerifyEmail();
  };
  return (
    <DashboardLayout user={data}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Hồ sơ cá nhân
            </h1>
            <p className="text-muted-foreground mt-1">
              Quản lý thông tin tài khoản của bạn
            </p>
          </div>
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-primary hover:bg-primary/90 cursor-pointer gap-2"
            >
              Chỉnh sửa hồ sơ
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="gap-2 bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
                Hủy
              </Button>
              <Button
                onClick={() => handleSave()}
                className="bg-primary hover:bg-primary/90 gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Lưu thay đổi
              </Button>
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20">
                  <Image
                    src={avatarPreview || "/placeholder.svg"}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    width={128}
                    height={128}
                  />
                </div>
                {isEditing && (
                  <label
                    htmlFor="avatar-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera className="w-8 h-8 text-white" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </label>
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {formData?.fullname || "Chưa có tên"}
                </p>
                <p
                  className={cn(
                    "text-xs px-2 py-1 rounded-full inline-block mt-1",
                    formData?.role === "ADMIN"
                      ? "bg-primary/20 text-primary"
                      : "bg-accent/20 text-accent-foreground"
                  )}
                >
                  {formData?.role === "ADMIN" ? "Quản trị viên" : "Nhân viên"}
                </p>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="fullname"
                    className="text-sm font-medium text-foreground"
                  >
                    Họ và tên
                  </Label>
                  <Input
                    id="fullname"
                    value={formData?.fullname || ""}
                    onChange={(e) =>
                      handleInputChange("fullname", e.target.value)
                    }
                    disabled={!isEditing}
                    className={cn(
                      "bg-background border-border",
                      !isEditing && "opacity-70 cursor-not-allowed"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="username"
                    className="text-sm font-medium text-foreground"
                  >
                    Tên đăng nhập
                  </Label>
                  <Input
                    id="username"
                    value={formData?.username || ""}
                    onChange={(e) =>
                      handleInputChange("username", e.target.value)
                    }
                    disabled={!isEditing}
                    className={cn(
                      "bg-background border-border",
                      !isEditing && "opacity-70 cursor-not-allowed"
                    )}
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground"
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData?.email || ""}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    disabled
                    className={cn(
                      "bg-background border-border",
                      !isEditing && "opacity-70 cursor-not-allowed"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="phone"
                    className="text-sm font-medium text-foreground"
                  >
                    Số điện thoại
                  </Label>
                  <Input
                    id="phone"
                    value={formData?.phone_number || ""}
                    onChange={(e) =>
                      handleInputChange("phone_number", e.target.value)
                    }
                    disabled={!isEditing}
                    className={cn(
                      "bg-background border-border",
                      !isEditing && "opacity-70 cursor-not-allowed"
                    )}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="location"
                    className="text-sm font-medium text-foreground"
                  >
                    Địa chỉ
                  </Label>
                  <Input
                    id="location"
                    value={formData?.location || ""}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
                    disabled={!isEditing}
                    className={cn(
                      "bg-background border-border",
                      !isEditing && "opacity-70 cursor-not-allowed"
                    )}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Thông tin tài khoản
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Trạng thái xác thực</p>
                    <p
                      className={cn(
                        "font-medium mt-1",
                        formData?.verify === "VERIFIED"
                          ? "text-accent"
                          : "text-destructive"
                      )}
                    >
                      {formData?.verify === "VERIFIED"
                        ? "Đã xác thực"
                        : "Chưa xác thực"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ngày tạo tài khoản</p>
                    <p className="font-medium text-foreground mt-1">
                      {formData?.created_at
                        ? new Date(formData.created_at).toLocaleDateString(
                            "vi-VN"
                          )
                        : "Chưa có thông tin"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cập nhật lần cuối</p>
                    <p className="font-medium text-foreground mt-1">
                      {formData?.updated_at
                        ? new Date(formData.updated_at).toLocaleDateString(
                            "vi-VN"
                          )
                        : "Chưa có thông tin"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ID tài khoản</p>
                    <p className="font-medium text-foreground mt-1 font-mono text-xs">
                      {formData?._id || "Chưa có ID"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Bảo mật
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Đổi mật khẩu</p>
                <p className="text-sm text-muted-foreground">
                  Cập nhật mật khẩu của bạn
                </p>
              </div>
              <Link href="/user/profile/change-password">
                <Button variant="outline" className="cursor-pointer">Thay đổi</Button>
              </Link>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <p className="font-medium text-foreground">Xác thực email</p>
                <p className="text-sm text-muted-foreground">
                  Tăng cường bảo mật tài khoản
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => handleResendVerifyEmail()}
                className="gap-2 cursor-pointer"
                disabled={formData?.verify === "VERIFIED"}
              >
                <Mail className="w-4 h-4" />
                {formData?.verify === "VERIFIED"
                  ? "Đã xác thực"
                  : "Gửi email xác thực"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Me } from "@/types/GraphQL";
import { cn } from "@/lib/utils";
import { Mail, X } from "lucide-react";
import { Save, Loader2, Camera } from "lucide-react";
import { Dispatch , SetStateAction } from "react";
interface ProfileProps {
  user: Me;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formData: Me | null;
  handleInputChange: (field: keyof Me, value: string) => void;
  avatarPreview: string;
  handleCancel: () => void; 
  handleUserAccountChange: (
    field: keyof Me["userAccount"],
    value: string
  ) => void;
  setIsVerifyEmailModalOpen: (isOpen: boolean) => void;
  handleResendVerifyEmail: () => void;
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>; // Thêm mới
  isSaving: boolean;
  handleSave: () => Promise<void>;
}
import { formatToVNTime } from "@/lib/formateVNDate";
import { useRouter } from "next/navigation";
export default function Profile({
  user,
  handleAvatarChange,
  handleInputChange,
  handleUserAccountChange,
  setIsVerifyEmailModalOpen,
  handleResendVerifyEmail,
  isEditing,        // Nhận từ props
  setIsEditing,     // Nhận từ props
  isSaving,         // Nhận từ props
  handleSave,
  formData,
  avatarPreview,
  handleCancel
}: ProfileProps) {
  const router = useRouter();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const handleNavigate = () => {
    if (user.role === "ADMIN") {
      router.push("/admin/profile/change-password");
    } else if (user.role === "STAFF") {
      router.push("/staff/profile/change-password");
    } else if (user.role === "SOS") {
      router.push("/sos/profile/change-password");
    } else {
      router.push("/user/profile/change-password");
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hồ sơ cá nhân</h1>
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
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 bg-muted">
                <Image
                  src={avatarPreview || "/placeholder.svg"}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  width={128}
                  height={128}
                  priority
                />
              </div>
              {isEditing && (
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  ) : (
                    <Camera className="w-8 h-8 text-white" />
                  )}
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={isUploadingAvatar}
                  />
                </label>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {formData?.name || "Chưa có tên"}
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
                  id="name"
                  value={formData?.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
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
                  value={formData?.userAccount.email || ""}
                  onChange={(e) =>
                    handleUserAccountChange("email", e.target.value)
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
                  value={formData?.userAccount.email || ""}
                  onChange={(e) =>
                    handleUserAccountChange("email", e.target.value)
                  }
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
                  value={formData?.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  disabled={!isEditing}
                  className={cn(
                    "bg-background border-border",
                    !isEditing && "opacity-70 cursor-not-allowed"
                  )}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label
                  htmlFor="address"
                  className="text-sm font-medium text-foreground"
                >
                  Địa chỉ
                </Label>
                <Input
                  id="address"
                  value={formData?.address || ""}
                  onChange={(e) => handleInputChange("address", e.target.value)}
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
                      formData?.verify === "Verified"
                        ? "text-accent"
                        : "text-destructive"
                    )}
                  >
                    {formData?.verify === "Verified"
                      ? "Đã xác thực"
                      : "Chưa xác thực"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ngày tạo tài khoản</p>
                  <p className="font-medium text-foreground mt-1">
                    {formData?.createdAt
                      ? formatToVNTime(formData.createdAt)
                      : "Chưa có thông tin"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cập nhật lần cuối</p>
                  <p className="font-medium text-foreground mt-1">
                    {formData?.updatedAt
                      ? formatToVNTime(formData.updatedAt)
                      : "Chưa có thông tin"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">ID tài khoản</p>
                  <p className="font-medium text-foreground mt-1 font-mono text-xs">
                    {formData?.id || "Chưa có ID"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Bảo mật</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Đổi mật khẩu</p>
              <p className="text-sm text-muted-foreground">
                Cập nhật mật khẩu của bạn
              </p>
            </div>

            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={handleNavigate}
            >
              Thay đổi
            </Button>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              <p className="font-medium text-foreground">Xác thực email</p>
              <p className="text-sm text-muted-foreground">
                Tăng cường bảo mật tài khoản
              </p>
            </div>

            <div className="flex gap-2">
              {formData?.verify !== "VERIFIED" && (
                <Button
                  variant="outline"
                  onClick={() => setIsVerifyEmailModalOpen(true)}
                  className="gap-2 cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  Xác thực với OTP
                </Button>
              )}
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
    </div>
  );
}

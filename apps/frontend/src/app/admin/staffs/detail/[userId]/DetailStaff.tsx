"use client";
import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Shield,
  CreditCard,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatToVNTime } from "@lib/formatVNDate";
import { Button } from "@/components/ui/button";
import type {
  DetailUser as Me,
  Station,
  VerifyStatus,
  UserRole,
} from "@/types";
import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UpdateUserFormData } from "@/schemas/user-schema";

type StatusConfig = {
  label: string;
  variant:
    | "success"
    | "warning"
    | "destructive"
    | "secondary"
    | "pending"
    | "danger";
};

type UserDisplayStatus = VerifyStatus | "BANNED";

const roleConfig = {
  ADMIN: { label: "ADMIN", variant: "default" as const },
  STAFF: { label: "STAFF", variant: "info" as const },
  USER: { label: "USER", variant: "secondary" as const },
  TECHNICIAN: { label: "TECHNICIAN", variant: "warning" as const },
  AGENCY: { label: "AGENCY", variant: "outline" as const },
  MANAGER: { label: "MANAGER", variant: "customBlue" as const },
};
type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED";
interface UserDetailProps {
  user: Me;
  onSubmit: ({ data }: { data: UpdateUserFormData }) => void;
  stations: Station[];
}

const getUserDisplayStatus = (user: {
  verify: VerifyStatus;
  accountStatus?: AccountStatus;
}): UserDisplayStatus => {
  return user.verify;
};
const statusMap: Record<AccountStatus, StatusConfig> = {
  ACTIVE: { label: "Đang hoạt động", variant: "success" },
  INACTIVE: { label: "Chưa kích hoạt", variant: "secondary" },
  SUSPENDED: { label: "Tạm dừng", variant: "warning" },
  BANNED: { label: "Đã bị khóa", variant: "danger" },
};
export const getStatusDisplay = (status: AccountStatus): StatusConfig => {
  return statusMap[status] || { label: "Không xác định", variant: "secondary" };
};
export default function DetailStaff({
  user,
  onSubmit,
  stations,
}: UserDetailProps) {
  const displayStatus = getUserDisplayStatus(user);
  const status = getStatusDisplay(user.accountStatus);
  const role = roleConfig[user.role] || roleConfig.USER;
  const [open, setOpen] = React.useState(false);
  const [editRole, setEditRole] = React.useState<UserRole>(user.role);
  const [verify, setVerify] = React.useState<"VERIFIED" | "UNVERIFIED">(
    displayStatus === "VERIFIED" ? "VERIFIED" : "UNVERIFIED",
  );
  const [accountStatus, setAccountStatus] = useState<
    "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED"
  >(user.accountStatus as AccountStatus);
  if (!user) {
    return (
      <div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Không có người dùng này!</p>
        </div>
      </div>
    );
  }
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSave = async () => {
    const payload = {
      accountStatus: accountStatus,
      verify: verify,
    };
    try {
      onSubmit({ data: payload });
      toast.success("Cập nhật thành công");
      setOpen(false);
    } catch {
      toast.error("Cập nhật thất bại");
    }
  };

  return (
    <div>
      <PageHeader
        title="Thông tin nhân viên"
        description={`Nhân viên: ${user.fullName}`}
        backLink="/admin/staffs"
        actions={
          <div className="flex">
            <div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Chỉnh sửa thông tin
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Chỉnh sửa (Admin)</DialogTitle>
                    <DialogDescription>
                      Cập nhật role + trạng thái + phân công (station/team).
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select
                        disabled
                        value={editRole}
                        onValueChange={(v: UserRole) => setEditRole(v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MANAGER">MANAGER</SelectItem>
                          <SelectItem value="STAFF">STAFF</SelectItem>
                          <SelectItem value="AGENCY">AGENCY</SelectItem>
                          <SelectItem value="TECHNICIAN">TECHNICIAN</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Verify status</Label>
                      <Select
                        value={verify}
                        onValueChange={(v) =>
                          setVerify(
                            v === "VERIFIED" ? "VERIFIED" : "UNVERIFIED",
                          )
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VERIFIED">VERIFIED</SelectItem>
                          <SelectItem value="UNVERIFIED">UNVERIFIED</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Account status</Label>
                      <Select
                        value={accountStatus}
                        onValueChange={(v: AccountStatus) =>
                          setAccountStatus(v)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                          <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                          <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                          <SelectItem value="BANNED">BANNED</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setOpen(false)}
                      type="button"
                    >
                      Hủy
                    </Button>
                    <Button onClick={handleSave} type="button">
                      Lưu
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage
                  src={user.avatar ?? undefined}
                  alt={user.fullName}
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                  {getInitials(user.fullName)}
                </AvatarFallback>
              </Avatar>

              <h2 className="text-xl font-bold text-foreground">
                {user.fullName}
              </h2>
              {user.email && (
                <p className="text-sm text-muted-foreground">{user.email}</p>
              )}

              <div className="flex gap-2 mt-3">
                <Badge variant={role.variant}>
                  <Shield className="h-3 w-3 mr-1" />
                  {role.label}
                </Badge>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              {displayStatus === "VERIFIED" && (
                <div className="flex items-center gap-1 text-sm text-green-600 mt-3">
                  <CheckCircle className="h-4 w-4" />
                  <span>Verified Account</span>
                </div>
              )}
              {displayStatus === "UNVERIFIED" && (
                <div className="flex items-center gap-1 text-sm text-red-600 mt-3">
                  <XCircle className="h-4 w-4" />
                  <span>Unverified Account</span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-border space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground break-all">
                  {user.email}
                </span>
              </div>
              {user.phoneNumber && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">
                    {user.phoneNumber}
                  </span>
                </div>
              )}
              {user.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">{user.location}</span>
                </div>
              )}
              {/* <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">
                  Born in {user.}
                </span>
              </div> */}
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Thông tin người dùng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Họ và tên:</Label>
                <p className="text-sm text-muted-foreground py-2">
                  {user.fullName}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Tên tài khoản:</Label>
                <p className="text-sm text-muted-foreground py-2">
                  {user.username || "Chưa có"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Email:</Label>
                <p className="text-sm text-muted-foreground py-2">
                  {user.email || "Chưa có"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Số điện thoại:</Label>
                <p className="text-sm text-muted-foreground py-2">
                  {user.phoneNumber || "Chưa có"}
                </p>
              </div>

              {/* <div className="space-y-2">
                <Label>Year of Birth</Label>
                <p className="text-sm text-muted-foreground py-2">{user.YOB}</p>
              </div> */}

              <div className="space-y-2">
                <Label>Chức vụ:</Label>
                <Badge variant={role.variant}>
                  <Shield className="h-3 w-3 mr-1" />
                  {role.label}
                </Badge>
              </div>

              {/* <div className="space-y-2">
                <Label>Trạng thái tài khoản:</Label>
                 <p className="text-sm text-muted-foreground">
                  <Badge
                    variant={
                      displayStatus === "VERIFIED" ? "success" : "danger"
                    }
                  >
                    {displayStatus === "VERIFIED"
                      ? "VERIFIED"
                        : "UNVERIFIED"}
                  </Badge>
                </p>
              </div> */}

              <div className="space-y-2">
                <Label>NFC Card UID:</Label>
                <p className="text-sm text-muted-foreground py-2">
                  {user.nfcCardUid || "Chưa có"}
                </p>
              </div>
            </div>

            {/* <div className="space-y-2">
              <Label>Address</Label>
              <p className="text-sm text-muted-foreground py-2">
                {user.location || "N/A"}
              </p>  
            </div> */}

            <div className="space-y-2">
              <Label>Địa chỉ:</Label>
              <p className="text-sm text-muted-foreground py-2">
                {user.location || "Chưa có"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Thông tin tài khoản
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>ID tài khoản:</Label>
                <p className="text-sm text-muted-foreground font-mono bg-muted/50 p-2 rounded">
                  {user.id}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Email:</Label>
                <p className="text-sm text-muted-foreground font-mono bg-muted/50 p-2 rounded">
                  {user.email}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Trạng thái tài khoản:</Label>
                <p className="text-sm text-muted-foreground">
                  <Badge
                    variant={
                      displayStatus === "VERIFIED" ? "success" : "danger"
                    }
                  >
                    {displayStatus === "VERIFIED"
                      ? "Đã xác thực"
                      : "Chưa xác thực"}
                  </Badge>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-border">
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground">Thời gian tạo: </span>
                  <span className="font-medium">
                    {formatToVNTime(user.createdAt || "")}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground">
                    Thời gian cập nhật:{" "}
                  </span>
                  <span className="font-medium">
                    {formatToVNTime(user.updatedAt || "")}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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
import Link from "next/link";
import type { DetailUser as Me, Station, VerifyStatus } from "@/types";
import * as React from "react";
import { toast } from "sonner";
import type { UseMutationResult } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";
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
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  updateStaffSchema,
  type UpdateStaffFormData,
} from "@/schemas/user-schema";

type StatusConfig = {
  label: string;
  variant: "success" | "muted" | "destructive";
};

type UserDisplayStatus = VerifyStatus | "BANNED";

const statusConfig: Record<UserDisplayStatus, StatusConfig> = {
  VERIFIED: { label: "Đã xác thực", variant: "success" },
  UNVERIFIED: { label: "Chưa xác thực", variant: "muted" },
  BANNED: { label: "Bị khóa", variant: "destructive" },
  "": { label: "Không xác định", variant: "muted" },
};

const roleConfig = {
  ADMIN: { label: "Admin", variant: "default" as const },
  STAFF: { label: "Staff", variant: "info" as const },
  USER: { label: "User", variant: "secondary" as const },
  SOS: { label: "SOS", variant: "secondary" as const },
};
type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED";

interface UserDetailProps {
  user: Me;
  updateProfileStaffMutation: UseMutationResult<
    AxiosResponse<Me>,
    unknown,
    { id: string; data: UpdateStaffFormData },
    unknown
  >;
  stations: Station[];
}

const getUserDisplayStatus = (user: {
  verify: VerifyStatus;
  accountStatus?: string;
}): UserDisplayStatus => {
  return user.accountStatus === "BANNED" ? "BANNED" : user.verify;
};

export default function DetailUser({
  user,
  updateProfileStaffMutation,
  stations,
}: UserDetailProps) {
  const displayStatus = getUserDisplayStatus(user);
  const status = statusConfig[displayStatus] || statusConfig.UNVERIFIED;
  const role = roleConfig[user.role] || roleConfig.USER;

  const [open, setOpen] = React.useState(false);
  const [editRole, setEditRole] = React.useState<"STAFF" | "TECHNICIAN">(
    "STAFF",
  );
  const [verify, setVerify] = React.useState<
    "VERIFIED" | "UNVERIFIED"
  >(displayStatus === "VERIFIED" ? "VERIFIED" : "UNVERIFIED");
  const [accountStatus, setAccountStatus] = useState<
    "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED"
  >(user.accountStatus as AccountStatus);
  const [stationId, setStationId] = React.useState(user.orgAssignment.station.id);
  const [technicianTeamId, setTechnicianTeamId] = React.useState("");
  const mutationState = updateProfileStaffMutation as unknown as {
    isPending?: boolean;
    isLoading?: boolean;
  };
  const isSaving = Boolean(mutationState.isPending ?? mutationState.isLoading);
  if (!user) {
    return (
      <div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">User not found.</p>
        </div>
      </div>
    );
  }

  //   const status = statusConfig[user.status] || statusConfig.Inactive;
  //   const role = roleConfig[user.role] || roleConfig.USER;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSave = async () => {
    const raw =
      editRole === "STAFF"
        ? ({
            role: "STAFF",
            accountStatus,
            verify,
            orgAssignment: { stationId: stationId.trim() },
          } satisfies UpdateStaffFormData)
        : ({
            role: "TECHNICIAN",
            accountStatus,
            verify,
            orgAssignment: { technicianTeamId: technicianTeamId.trim() },
          } satisfies UpdateStaffFormData);

    const parsed = updateStaffSchema.safeParse(raw);
    if (!parsed.success) {
      toast.error(parsed.error.issues?.[0]?.message || "Dữ liệu không hợp lệ");
      return;
    }

    try {
      await updateProfileStaffMutation.mutateAsync({
        id: user.id,
        data: parsed.data,
      });
      toast.success("Cập nhật thành công");
      setOpen(false);
    } catch {
      toast.error("Cập nhật thất bại");
    }
  };

  return (
    <div>
      <PageHeader
        title="Thông tin người dùng"
        description={`Người dùng: ${user.fullName}`}
        backLink="/admin/customers"
        actions={
          <div className="flex gap-2">
            <div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/customers/wallet/${user.id}`}>
                  <User className="h-4 w-4 mr-2" />
                  Ví người dùng
                </Link>
              </Button>
            </div>
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
                        value={editRole}
                        onValueChange={(v) =>
                          setEditRole(
                            v === "TECHNICIAN" ? "TECHNICIAN" : "STAFF",
                          )
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STAFF">STAFF</SelectItem>
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
                    {editRole === "STAFF" ? (
                      <div className="space-y-2">
                        <Label>Station ID</Label>
                        <Select value={stationId} onValueChange={setStationId}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn trạm" />
                          </SelectTrigger>

                          <SelectContent className="max-h-60 overflow-y-auto">
                            <SelectScrollUpButton />
                            {stations.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name} - {s.address}
                              </SelectItem>
                            ))}
                            <SelectScrollDownButton />
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Technician Team ID</Label>
                        <Input
                          value={technicianTeamId}
                          onChange={(e) => setTechnicianTeamId(e.target.value)}
                          placeholder="UUID technicianTeamId"
                        />
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setOpen(false)}
                      disabled={isSaving}
                      type="button"
                    >
                      Hủy
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      type="button"
                    >
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
        {/* Profile Card */}
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
                <Badge>{status.label}</Badge>
              </div>

              {displayStatus === "VERIFIED" && (
                <div className="flex items-center gap-1 text-sm text-green-600 mt-3">
                  <CheckCircle className="h-4 w-4" />
                  <span>Verified Account</span>
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
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <p className="text-sm text-muted-foreground py-2">
                  {user.fullName}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Username</Label>
                <p className="text-sm text-muted-foreground py-2">
                  {user.username || "N/A"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Email Address</Label>
                <p className="text-sm text-muted-foreground py-2">
                  {user.email || "N/A"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <p className="text-sm text-muted-foreground py-2">
                  {user.phoneNumber || "N/A"}
                </p>
              </div>

              {/* <div className="space-y-2">
                <Label>Year of Birth</Label>
                <p className="text-sm text-muted-foreground py-2">{user.YOB}</p>
              </div> */}

              <div className="space-y-2">
                <Label>Role</Label>
                <p className="text-sm text-muted-foreground py-2">
                  {user.role}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <p className="text-sm text-muted-foreground py-2">
                  {displayStatus === "VERIFIED"
                    ? "Verified"
                    : displayStatus === "BANNED"
                      ? "Banned"
                      : "Pending Verification"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>NFC Card UID</Label>
                <p className="text-sm text-muted-foreground py-2">
                  {user.nfcCardUid || "N/A"}
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
              <Label>Location</Label>
              <p className="text-sm text-muted-foreground py-2">
                {user.location || "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Info Card */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Account ID</Label>
                <p className="text-sm text-muted-foreground font-mono bg-muted/50 p-2 rounded">
                  {user.id}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Account Email</Label>
                <p className="text-sm text-muted-foreground font-mono bg-muted/50 p-2 rounded">
                  {user.email}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Verification Status</Label>
                <p className="text-sm text-muted-foreground">
                  <Badge
                    variant={
                      displayStatus === "VERIFIED" ? "success" : "warning"
                    }
                  >
                    {displayStatus === "VERIFIED"
                      ? "Verified"
                      : displayStatus === "BANNED"
                        ? "Banned"
                        : "Pending Verification"}
                  </Badge>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-border">
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground">Created: </span>
                  <span className="font-medium">
                    {formatToVNTime(user.createdAt || "")}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground">Updated: </span>
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

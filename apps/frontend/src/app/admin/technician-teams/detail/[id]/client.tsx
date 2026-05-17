
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Users,
  MapPin,
  Calendar,
  Shield,
  ArrowLeft,
  UserCheck,
  UserX,
  Settings,
  Info,
  Save,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { formatToVNTime } from "@/lib/formatVNDate";

import type { ApiResponseData, TechnicianStatus } from "@/types/TechnicianTeam";
import {
  UpdateTechnicianTeamSchema,
  updateTechnicianTeamSchema,
} from "@/schemas/technician-schema";
import { ROLE_LABELS } from "@/columns/user-columns";

function SectionCard({
  icon: Icon,
  title,
  children,
  footer,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm", className)}>
      <div className="flex items-center gap-2 border-b border-border/60 px-5 py-4">
        <Icon className="h-5 w-5 shrink-0 text-primary" />
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
      {footer}
    </div>
  );
}

function FormField({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs font-bold uppercase text-muted-foreground/80">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  );
}

const getTeamStatusConfig = (status: TechnicianStatus) => {
  switch (status) {
    case "AVAILABLE":
      return {
        label: "Đang hoạt động",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: UserCheck,
      };
    case "UNAVAILABLE":
      return {
        label: "Tạm ngưng",
        color: "bg-slate-100 text-slate-800 border-slate-200",
        icon: UserX,
      };
    default:
      return {
        label: "Trống",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: Info,
      };
  }
};

interface TechnicianTeamDetailViewProps {
  team: ApiResponseData;
  onSubmit: (data: UpdateTechnicianTeamSchema) => Promise<boolean>;
}

export function TechnicianTeamDetailView({
  team,
  onSubmit,
}: TechnicianTeamDetailViewProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState<"AVAILABLE" | "UNAVAILABLE">(
    team.availabilityStatus === "AVAILABLE" ? "AVAILABLE" : "UNAVAILABLE"
  );
  const statusInfo = getTeamStatusConfig(team.availabilityStatus);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateTechnicianTeamSchema>({
    resolver: zodResolver(updateTechnicianTeamSchema),
    mode: "onChange",
    defaultValues: {
      name: team.name || "",
      availabilityStatus:
        team.availabilityStatus === "AVAILABLE" ? "AVAILABLE" : "UNAVAILABLE",
    },
  });

  const openEditForm = () => {
    const currentStatus =
      team.availabilityStatus === "AVAILABLE" ? "AVAILABLE" : "UNAVAILABLE";
    reset({
      name: team.name || "",
      availabilityStatus: currentStatus,
    });
    setEditStatus(currentStatus);
    setIsEditing(true);
  };

  const onSave = async (data: UpdateTechnicianTeamSchema) => {
    const success = await onSubmit(data);
    if (success) {
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-slate-50 p-6 dark:bg-background border-b">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Chi tiết đội: {team.name}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing ? (
                <>
                  <Button variant="default" onClick={openEditForm}>
                    <Settings className="mr-2 h-4 w-4" />
                    Chỉnh sửa đội
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/admin/technician-teams")}
                  >
                    Danh sách đội
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="default"
                    onClick={handleSubmit(onSave)}
                    disabled={isSubmitting}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Lưu thay đổi
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="mr-2 h-4 w-4" />
                    Hủy
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Meta Info Bar */}
      <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-sm sm:flex-row sm:items-center sm:gap-x-8">
        <div>
          <span className="text-muted-foreground">Team ID: </span>
          <span className="font-mono text-xs font-bold text-foreground">
            {team.id}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Ngày tạo: </span>
          <span className="text-foreground">
            {formatToVNTime(team.createdAt)}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Cập nhật: </span>
          <span className="text-foreground">
            {formatToVNTime(team.updatedAt)}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cột trái: Thông tin chính và Thành viên */}
        <div className="space-y-6 lg:col-span-2">
          <SectionCard icon={Users} title="Thông tin đội kỹ thuật">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField label="Tên đội" required>
                {isEditing ? (
                  <div>
                    <Input
                      {...register("name")}
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs font-medium text-red-500">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-1 text-sm font-medium text-foreground">
                    {team.name}
                  </div>
                )}
              </FormField>

              <FormField label="Trạng thái hoạt động" required>
                {isEditing ? (
                  <div>
                    <Select
                      value={editStatus}
                      onValueChange={(val) => {
                        const statusVal = val as "AVAILABLE" | "UNAVAILABLE";
                        setEditStatus(statusVal);
                        setValue("availabilityStatus", statusVal, {
                          shouldValidate: true,
                        });
                      }}
                    >
                      <SelectTrigger
                        className={
                          errors.availabilityStatus ? "border-red-500" : ""
                        }
                      >
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AVAILABLE">
                          Đang hoạt động
                        </SelectItem>
                        <SelectItem value="UNAVAILABLE">Tạm ngưng</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.availabilityStatus && (
                      <p className="mt-1 text-xs font-medium text-red-500">
                        {errors.availabilityStatus.message}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-1">
                    <Badge
                      className={cn(
                        "rounded-full px-3 py-1 font-semibold border shadow-none",
                        statusInfo.color
                      )}
                    >
                      <statusInfo.icon className="mr-1 h-3 w-3" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                )}
              </FormField>

              <FormField label="Số lượng thành viên">
                <div className="mt-1 text-sm font-medium text-foreground">
                  {team.memberCount} nhân sự
                </div>
              </FormField>
              
              <FormField label="Phạm vi quản lý">
                <div className="mt-1 text-sm font-medium text-foreground">
                  Khu vực trạm chỉ định
                </div>
              </FormField>
            </div>
          </SectionCard>

          <SectionCard icon={Shield} title="Danh sách thành viên">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs font-medium uppercase text-muted-foreground">
                  <tr className="border-b border-border/60">
                    <th className="pb-3 pr-4 font-semibold">Thành viên</th>
                    <th className="pb-3 pr-4 font-semibold">Vai trò</th>
                    <th className="pb-3 text-right font-semibold">ID Người dùng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {team.members && team.members.length > 0 ? (
                    team.members.map((member) => (
                      <tr
                        key={member.userId}
                        className="group hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
                              {member.fullName.charAt(0)}
                            </div>
                            <p className="font-medium">{member.fullName}</p>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-bold"
                          >
                            {ROLE_LABELS[member.role]}
                          </Badge>
                        </td>
                        <td className="py-4 text-right font-mono text-xs text-muted-foreground">
                          {member.userId}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-8 text-center text-muted-foreground"
                      >
                        Đội hiện chưa có thành viên nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        {/* Cột phải: Trạm và Thống kê nhanh */}
        <div className="space-y-6">
          <SectionCard icon={MapPin} title="Trạm phụ trách">
            <div className="space-y-4">
              <FormField label="Tên trạm">
                <div className="mt-1 text-sm font-medium text-foreground">
                  {team.station.name}
                </div>
              </FormField>
              <FormField label="Địa chỉ">
                <div className="mt-1 text-xs leading-relaxed text-foreground">
                  {team.station.address}
                </div>
              </FormField>
              <Button variant="link" className="h-auto p-0 text-primary text-xs">
                Xem vị trí trên bản đồ
              </Button>
            </div>
          </SectionCard>

          <SectionCard icon={Calendar} title="Tóm tắt hoạt động">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-muted-foreground">Hiệu suất đội</span>
                <span className="font-bold text-green-600">Tốt</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-muted-foreground">Công việc chờ</span>
                <span className="font-bold">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Phân loại</span>
                <span className="font-bold">Kỹ thuật viên</span>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
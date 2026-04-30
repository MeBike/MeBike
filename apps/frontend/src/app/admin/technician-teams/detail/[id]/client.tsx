"use client";

import {
  Users,
  MapPin,
  Calendar,
  Shield,
  ArrowLeft,
  UserCheck,
  UserX,
  Settings,
  Mail,
  Info
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatToVNTime } from "@/lib/formatVNDate";
import type { 
  ApiResponseData, 
  Member, 
  TechnicianStatus 
} from "@/types/TechnicianTeam";

// Tái sử dụng SectionCard để đồng bộ UI
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

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

// Cấu hình trạng thái hoạt động của đội
const getTeamStatusConfig = (status: TechnicianStatus) => {
  switch (status) {
    case "AVAILABLE":
      return { 
        label: "Đang hoạt động", 
        color: "bg-green-100 text-green-800 border-green-200",
        icon: UserCheck 
      };
    case "UNAVAILABLE":
      return { 
        label: "Tạm ngưng", 
        color: "bg-slate-100 text-slate-800 border-slate-200",
        icon: UserX 
      };
    default:
      return { 
        label: "Trống", 
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: Info 
      };
  }
};

interface TechnicianTeamDetailViewProps {
  team: ApiResponseData;
  onUpdate?: (id: string) => void;
}

export function TechnicianTeamDetailView({
  team,
  onUpdate
}: TechnicianTeamDetailViewProps) {
  const router = useRouter();
  const statusInfo = getTeamStatusConfig(team.availabilityStatus);

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
              <Button variant="default" onClick={() => onUpdate?.(team.id)}>
                <Settings className="mr-2 h-4 w-4" />
                Chỉnh sửa đội
              </Button>
              <Button variant="outline" onClick={() => router.push("/admin/technician-teams")}>
                Danh sách đội
              </Button>
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
              <Field label="Tên đội" value={team.name} />
              <Field
                label="Trạng thái hoạt động"
                value={
                  <Badge className={cn("rounded-full px-3 py-1 font-semibold border shadow-none", statusInfo.color)}>
                    <statusInfo.icon className="mr-1 h-3 w-3" />
                    {statusInfo.label}
                  </Badge>
                }
              />
              <Field label="Số lượng thành viên" value={`${team.memberCount} nhân sự`} />
              <Field label="Phạm vi quản lý" value="Khu vực trạm chỉ định" />
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
                      <tr key={member.userId} className="group hover:bg-muted/30 transition-colors">
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
                              {member.fullName.charAt(0)}
                            </div>
                            <p className="font-medium">{member.fullName}</p>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <Badge variant="secondary" className="text-[10px] font-bold">
                            {member.role}
                          </Badge>
                        </td>
                        <td className="py-4 text-right font-mono text-xs text-muted-foreground">
                          {member.userId}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-muted-foreground">
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
              <Field label="Tên trạm" value={team.station.name} />
              <Field 
                label="Địa chỉ" 
                value={<span className="text-xs leading-relaxed">{team.station.address}</span>} 
              />
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
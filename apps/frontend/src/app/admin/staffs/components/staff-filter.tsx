"use client";

import { Button } from "@/components/ui/button";
import { Dispatch, SetStateAction } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListFilter, RotateCcw, UserCheck, Briefcase } from "lucide-react";
import type { UserRole, VerifyStatus } from "@custom-types"; 
import { UserStatusFilter } from "../page";

interface StaffFiltersProps {
  verifyFilter: UserStatusFilter;
  setVerifyFilter: Dispatch<SetStateAction<UserStatusFilter>>;
  roleFilter: UserRole | ""; 
  setRoleFilter: Dispatch<SetStateAction<UserRole | "">>;
  handleFilterChange: () => void;
  onReset?: () => void;
}

export function StaffFilters({
  verifyFilter,
  setVerifyFilter,
  roleFilter,
  setRoleFilter,
  handleFilterChange,
  onReset,
}: StaffFiltersProps) {
  
  const handleLocalReset = () => {
    setVerifyFilter("all");
    setRoleFilter("");
    if (onReset) onReset();
    handleFilterChange();
  };

  const isFiltering = verifyFilter !== "all" || roleFilter !== "";

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm transition-all">
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <ListFilter className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold tracking-tight">Bộ lọc nhân viên</span>
        </div>
        
        {isFiltering && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLocalReset}
            className="h-8 px-2 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Xóa bộ lọc
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-6 p-4">
        {/* Lọc Trạng thái xác thực */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <UserCheck className="h-3.5 w-3.5" />
            Trạng thái xác thực
          </label>
          <Select
            value={verifyFilter}
            onValueChange={(val) => {
              setVerifyFilter(val as UserStatusFilter);
              handleFilterChange();
            }}
          >
            <SelectTrigger className="h-9 w-[180px] border-border/60 bg-background/50 text-sm focus:ring-1 focus:ring-primary">
              <SelectValue placeholder="Chọn trạng thái" />
            </SelectTrigger>
            <SelectContent position="popper" className="rounded-lg shadow-xl">
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="VERIFIED">Đã xác thực</SelectItem>
              <SelectItem value="UNVERIFIED">Chưa xác thực</SelectItem>
              <SelectItem value="BANNED">Bị cấm</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lọc Chức vụ */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Briefcase className="h-3.5 w-3.5" />
            Chức vụ
          </label>
          <Select
            value={roleFilter || "all-roles"}
            onValueChange={(val) => {
              // Cast val về kiểu mong muốn để tránh lỗi TypeScript
              const newValue = val === "all-roles" ? "" : (val as UserRole);
              setRoleFilter(newValue);
              handleFilterChange();
            }}
          >
            <SelectTrigger className="h-9 w-[200px] border-border/60 bg-background/50 text-sm focus:ring-1 focus:ring-primary">
              <SelectValue placeholder="Chọn chức vụ" />
            </SelectTrigger>
            <SelectContent position="popper" className="rounded-lg shadow-xl">
              <SelectItem value="all-roles">Tất cả chức vụ</SelectItem>
              <SelectItem value="MANAGER">Quản lý</SelectItem>
              <SelectItem value="STAFF">Nhân viên</SelectItem>
              <SelectItem value="TECHNICIAN">Kỹ thuật viên</SelectItem>
              <SelectItem value="AGENCY">Đại lý</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
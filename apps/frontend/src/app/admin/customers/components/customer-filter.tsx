"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListFilter, RotateCcw, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { VerifyStatus } from "@/types";
type UserStatusFilter = VerifyStatus | "BANNED" | "all";

interface UserFiltersProps {
  verifyFilter: UserStatusFilter;
  setVerifyFilter: (value: UserStatusFilter) => void;
  handleFilterChange: () => void;
  onReset?: () => void;
}

export function UserFilters({
  verifyFilter,
  setVerifyFilter,
  handleFilterChange,
  onReset,
}: UserFiltersProps) {
  
  const handleReset = () => {
    setVerifyFilter("all");
    if (onReset) onReset();
    handleFilterChange(); // Đưa về trang 1
  };

  const isFiltering = verifyFilter !== "all";

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm transition-all">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <ListFilter className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold tracking-tight">Bộ lọc</span>
        </div>

        {isFiltering && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 px-2 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* Body */}
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
            <SelectTrigger className="h-9 w-[200px] border-border/60 bg-background/50 text-sm focus:ring-1 focus:ring-primary">
              <SelectValue placeholder="Chọn trạng thái" />
            </SelectTrigger>
            <SelectContent position="popper" className="rounded-lg shadow-xl">
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="VERIFIED">Đã xác thực</SelectItem>
              <SelectItem value="UNVERIFIED">Chưa xác thực</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
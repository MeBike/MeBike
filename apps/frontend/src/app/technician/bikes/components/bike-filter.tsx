"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListFilter, RotateCcw, Tag, MapPin, Package } from "lucide-react";
import type { BikeStatus, Station, Supplier } from "@custom-types";
import { cn } from "@/lib/utils";

interface BikeFiltersProps {
  statusFilter: BikeStatus | "all";
  setStatusFilter: (status: BikeStatus | "all") => void;
}

export function BikeFilters({
  statusFilter,
  setStatusFilter,
}: BikeFiltersProps) {
  const handleReset = () => {
    setStatusFilter("all");
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm transition-all">
      {/* Header - Thanh mảnh và hiện đại */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <ListFilter className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold tracking-tight">Bộ lọc tìm kiếm</span>
        </div>
      </div>

      {/* Body - Các Select nằm gần nhau, không bị kéo giãn */}
      <div className="flex flex-wrap items-center gap-6 p-4">
        
        {/* Lọc Trạng thái */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Tag className="h-3 w-3" />
            Trạng thái
          </label>
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as BikeStatus | "all")}
          >
            <SelectTrigger className="h-9 w-[180px] border-border/60 bg-background/50 text-sm focus:ring-1 focus:ring-primary">
              <SelectValue placeholder="Chọn trạng thái" />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-[250px] rounded-lg shadow-xl">
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="AVAILABLE">Sẵn sàng</SelectItem>
              <SelectItem value="BOOKED">Đã đặt</SelectItem>
              <SelectItem value="RESERVED">Đã giữ chỗ</SelectItem>
              <SelectItem value="MAINTENANCE">Đang bảo trì</SelectItem>
              <SelectItem value="BROKEN">Đang hỏng</SelectItem>
            </SelectContent>
          </Select>
        </div>

      </div>
    </div>
  );
}
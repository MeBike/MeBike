"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Nhớ import Input
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListFilter, RotateCcw, Tag, MapPin, Package, Hash } from "lucide-react"; // Thêm icon Hash
import type { BikeStatus, Station, Supplier } from "@custom-types";
import { cn } from "@/lib/utils";

interface BikeFiltersProps {
  statusFilter: BikeStatus | "all";
  setStatusFilter: (status: BikeStatus | "all") => void;
  bikeId: string; // Thêm dòng này
  setBikeId: (id: string) => void; // Thêm dòng này
  onReset?: () => void;
}

export function BikeFilters({
  statusFilter,
  setStatusFilter,
  bikeId,
  setBikeId,
  onReset,
}: BikeFiltersProps) {
  const handleReset = () => {
    setStatusFilter("all");
    setBikeId(""); // Thêm dòng này để reset bikeId
    if (onReset) onReset();
  };

  const isFiltering =
    statusFilter !== "all" ||
    bikeId !== ""; // Thêm dòng này để kiểm tra xem có đang lọc mã xe không

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm transition-all">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <ListFilter className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold tracking-tight">Bộ lọc tìm kiếm</span>
        </div>
        
        {isFiltering && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 w-8 rounded-full p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-wrap items-center gap-6 p-4">
        
        {/* Lọc Mã xe (MỚI) */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Hash className="h-3 w-3" />
            Mã xe
          </label>
          <Input
            placeholder="Nhập mã xe..."
            value={bikeId}
            onChange={(e) => setBikeId(e.target.value)}
            className="h-9 w-[180px] border-border/60 bg-background/50 text-sm focus-visible:ring-1 focus-visible:ring-primary shadow-none"
          />
        </div>

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
            <SelectTrigger className="h-9 w-[180px] border-border/60 bg-background/50 text-sm focus:ring-1 focus:ring-primary shadow-none">
              <SelectValue placeholder="Chọn trạng thái" />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-[250px] rounded-lg shadow-xl">
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="AVAILABLE">Sẵn sàng</SelectItem>
              <SelectItem value="BOOKED">Đang thuê</SelectItem>
              <SelectItem value="RESERVED">Đặt trước</SelectItem>
              <SelectItem value="PENDING_DISPATCH">Chuẩn bị điều phối</SelectItem>
              <SelectItem value="TRANSPORTING">Đang vận chuyển</SelectItem>
              <SelectItem value="SWAPPING">Hỗ trợ sự cố</SelectItem>
              <SelectItem value="BROKEN">Đang hỏng</SelectItem>
              <SelectItem value="LOST">Đã mất</SelectItem>
              <SelectItem value="DISABLED">Tạm ngưng hoạt động</SelectItem>
              <SelectItem value="FIXED">Đã sửa</SelectItem>
            </SelectContent>
          </Select>
        </div>


      </div>
    </div>
  );
}
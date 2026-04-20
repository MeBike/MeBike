"use client";

import type { RentalStatus } from "@custom-types";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface RentalFiltersProps {
  searchQuery: string; // Giữ lại prop nếu bạn cần dùng sau này
  onSearchChange: (value: string) => void;
  statusFilter: RentalStatus | "all";
  onStatusChange: (value: RentalStatus | "all") => void;
  onReset: () => void;
}

export function RentalFilters({
  statusFilter,
  onStatusChange,
  onReset,
}: RentalFiltersProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      {/* Header của bộ lọc */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Bộ lọc</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onReset}
          className="h-8 px-2 lg:px-3 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4 mr-1" />
          Xóa bộ lọc
        </Button>
      </div>

      {/* Grid chứa các bộ lọc */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">
            Trạng thái đơn thuê
          </label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as RentalStatus | "all")}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary h-10"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="RENTED">Đang thuê</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>

        {/* Bạn có thể bỏ comment và chuyển các Input khác sang style tương tự tại đây */}
      </div>
    </div>
  );
}
"use client";

import type { BikeStatus, BikeType } from "@custom-types";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

interface BikeFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: BikeStatus | "all";
  onStatusChange: (value: BikeStatus | "all") => void;
  typeFilter: BikeType | "all";
  onTypeChange: (value: BikeType | "all") => void;
  onReset: () => void;
}

export function BikeFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  onReset,
}: BikeFiltersProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Bộ lọc</h3>
        <Button variant="ghost" size="sm" onClick={onReset}>
          <X className="w-4 h-4 mr-1" />
          Xóa bộ lọc
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="search">Tìm kiếm</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Tên xe, thương hiệu..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Trạng thái</Label>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Chọn trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="available">Sẵn sàng</SelectItem>
              <SelectItem value="rented">Đang thuê</SelectItem>
              <SelectItem value="maintenance">Bảo trì</SelectItem>
              <SelectItem value="retired">Ngừng hoạt động</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Loại xe</Label>
          <Select value={typeFilter} onValueChange={onTypeChange}>
            <SelectTrigger id="type">
              <SelectValue placeholder="Chọn loại xe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="mountain">Xe đạp địa hình</SelectItem>
              <SelectItem value="road">Xe đạp đường trường</SelectItem>
              <SelectItem value="city">Xe đạp thành phố</SelectItem>
              <SelectItem value="electric">Xe đạp điện</SelectItem>
              <SelectItem value="hybrid">Xe đạp hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

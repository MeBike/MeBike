"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ListFilter, RotateCcw, Building2, MapPin, Phone, User, Activity 
} from "lucide-react";

export function AgencyFilters({ filters, actions }: any) {
  const isFiltering = 
    filters.name !== "" || 
    filters.stationAddress !== "" || 
    filters.contactPhone !== "" || 
    filters.contactName !== "" || 
    filters.status !== "all";

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
            onClick={actions.handleReset}
            className="h-8 w-8 rounded-full p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-wrap items-center gap-6 p-4">
        {/* Lọc Tên Agency */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Building2 className="h-3 w-3" /> Tên Agency
          </label>
          <Input
            placeholder="Nhập tên..."
            value={filters.name}
            onChange={(e) => actions.setName(e.target.value)}
            className="h-9 w-[180px] bg-background/50 text-sm"
          />
        </div>

        {/* Lọc Trạng thái */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Activity className="h-3 w-3" /> Trạng thái
          </label>
          <Select
            value={filters.status}
            onValueChange={(val) => actions.setStatus(val)}
          >
            <SelectTrigger className="h-9 w-[150px] bg-background/50 text-sm">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
              <SelectItem value="INACTIVE">Ngưng hoạt động</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lọc Địa chỉ */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <MapPin className="h-3 w-3" /> Địa chỉ trạm
          </label>
          <Input
            placeholder="Tìm địa chỉ..."
            value={filters.stationAddress}
            onChange={(e) => actions.setStationAddress(e.target.value)}
            className="h-9 w-[200px] bg-background/50 text-sm"
          />
        </div>

        {/* Lọc SĐT */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Phone className="h-3 w-3" /> Số điện thoại
          </label>
          <Input
            placeholder="Nhập SĐT..."
            value={filters.contactPhone}
            onChange={(e) => actions.setContactPhone(e.target.value)}
            className="h-9 w-[150px] bg-background/50 text-sm"
          />
        </div>

        {/* Lọc Người đại diện */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <User className="h-3 w-3" /> Người đại diện
          </label>
          <Input
            placeholder="Tên đại diện..."
            value={filters.contactName}
            onChange={(e) => actions.setContactName(e.target.value)}
            className="h-9 w-[160px] bg-background/50 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
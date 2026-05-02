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
  ListFilter, RotateCcw, Tag, User, Bike, MapPin 
} from "lucide-react";
import type { RentalStatus, Station } from "@custom-types";

export function RentalFilters({ stations, filters, actions }: any) {
  const isFiltering =
    filters.statusFilter !== "" ||
    filters.userId !== "" ||
    filters.bikeId !== "" ||
    filters.startStation !== "" ||
    filters.endStation !== "";

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm transition-all">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <ListFilter className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold tracking-tight">Bộ lọc phiên thuê</span>
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
        {/* Trạng thái */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Tag className="h-3 w-3" /> Trạng thái
          </label>
          <Select
            value={filters.statusFilter || "all"}
            onValueChange={(val) => actions.setStatusFilter(val === "all" ? "" : val)}
          >
            <SelectTrigger className="h-9 w-[160px] bg-background/50 text-sm">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="RENTED">Đang thuê</SelectItem>
              <SelectItem value="COMPLETED">Đã hoàn thành</SelectItem>
              <SelectItem value="OVERDUE_UNRETURNED">Quá hạn chưa trả</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* User ID */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <User className="h-3 w-3" /> Người dùng
          </label>
          <Input
            placeholder="Nhập User ID..."
            value={filters.userId}
            onChange={(e) => actions.setUserId(e.target.value)}
            className="h-9 w-[160px] bg-background/50 text-sm"
          />
        </div>

        {/* Bike ID */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Bike className="h-3 w-3" /> Mã xe
          </label>
          <Input
            placeholder="Nhập Bike ID..."
            value={filters.bikeId}
            onChange={(e) => actions.setBikeId(e.target.value)}
            className="h-9 w-[160px] bg-background/50 text-sm"
          />
        </div>

        {/* Điểm đi (Start Station) */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <MapPin className="h-3 w-3" /> Điểm đi
          </label>
          <Select
            value={filters.startStation || "all"}
            onValueChange={(val) => actions.setStartStation(val === "all" ? "" : val)}
          >
            <SelectTrigger className="h-9 w-[180px] bg-background/50 text-sm">
              <SelectValue placeholder="Trạm bắt đầu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạm</SelectItem>
              {stations.map((s: Station) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Điểm trả (End Station) */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <MapPin className="h-3 w-3" /> Điểm trả
          </label>
          <Select
            value={filters.endStation || "all"}
            onValueChange={(val) => actions.setEndStation(val === "all" ? "" : val)}
          >
            <SelectTrigger className="h-9 w-[180px] bg-background/50 text-sm">
              <SelectValue placeholder="Trạm kết thúc" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạm</SelectItem>
              {stations.map((s: Station) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
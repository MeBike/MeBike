"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListFilter, RotateCcw, Tag, MapPin } from "lucide-react";
import type { BikeStatus, Station } from "@custom-types";

interface BikeFiltersProps {
  statusFilter: BikeStatus | "all";
  setStatusFilter: (status: BikeStatus | "all") => void;
  stationId?: string;
  setStationId?: (id: string) => void;
  stations?: Station[];
  onReset?: () => void;
}

export function BikeFilters({
  statusFilter,
  setStatusFilter,
  stationId,
  setStationId,
  stations = [],
  onReset,
}: BikeFiltersProps) {
  
  const handleReset = () => {
    setStatusFilter("all");
    if (setStationId) setStationId("all-stations");
    if (onReset) onReset();
  };

  const isFiltering =
    statusFilter !== "all" ||
    (stationId && stationId !== "" && stationId !== "all-stations");

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm transition-all">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <ListFilter className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold tracking-tight">Bộ lọc xe đạp</span>
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
        
        {/* Lọc Trạng thái */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Tag className="h-3 w-3" /> Trạng thái
          </label>
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as BikeStatus | "all")}
          >
            <SelectTrigger className="h-9 w-[180px] border-border/60 bg-background/50 text-sm focus:ring-1 focus:ring-primary">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent className="rounded-lg shadow-xl">
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="AVAILABLE">Sẵn sàng</SelectItem>
              <SelectItem value="BOOKED">Đã đặt</SelectItem>
              <SelectItem value="RESERVED">Đã giữ chỗ</SelectItem>
              <SelectItem value="REDISTRIBUTING">Đang điều phối</SelectItem>
              <SelectItem value="DISABLED">Tạm ngưng hoạt động</SelectItem>
              <SelectItem value="LOST">Đã mất</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* {setStationId && (
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <MapPin className="h-3 w-3" /> Trạm xe
            </label>
            <Select
              value={stationId || "all-stations"}
              onValueChange={(val) => setStationId(val === "all-stations" ? "" : val)}
            >
              <SelectTrigger className="h-9 w-[220px] border-border/60 bg-background/50 text-sm focus:ring-1 focus:ring-primary">
                <SelectValue placeholder="Chọn trạm" />
              </SelectTrigger>
              <SelectContent className="rounded-lg shadow-xl">
                <SelectItem value="all-stations">Tất cả các trạm</SelectItem>
                {stations.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )} */}
      </div>
    </div> 
  );
}
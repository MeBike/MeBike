"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListFilter, RotateCcw, MapPin, Activity } from "lucide-react";
import type { Station, TechnicianStatus } from "@/types";

interface TechnicianTeamFiltersProps {
  stationId: string;
  setStationId: (id: string) => void;
  statusFilter: TechnicianStatus | "";
  setStatusFilter: (status: TechnicianStatus | "") => void;
  stations: Station[];
  onReset?: () => void;
}

export function TechnicianTeamFilters({
  stationId,
  setStationId,
  statusFilter,
  setStatusFilter,
  stations,
  onReset,
}: TechnicianTeamFiltersProps) {
  const handleReset = () => {
    setStationId("all-stations");
    setStatusFilter("");
    if (onReset) onReset();
  };

  const isFiltering = 
    (stationId !== "" && stationId !== "all-stations") || 
    statusFilter !== "";

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm transition-all">
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <ListFilter className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold tracking-tight">Bộ lọc đội kỹ thuật</span>
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

      <div className="flex flex-wrap items-center gap-6 p-4">
        {/* Lọc Trạm xe */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <MapPin className="h-3 w-3" />
            Trạm phụ trách
          </label>
          <Select
            value={stationId || "all-stations"}
            onValueChange={(val) => setStationId(val === "all-stations" ? "" : val)}
          >
            <SelectTrigger className="h-9 w-[220px] border-border/60 bg-background/50 text-sm focus:ring-1 focus:ring-primary">
              <SelectValue placeholder="Chọn trạm" />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-[300px] rounded-lg">
              <SelectItem value="all-stations">Tất cả các trạm</SelectItem>
              {stations.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lọc Trạng thái (MỚI) */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Activity className="h-3 w-3" />
            Trạng thái hoạt động
          </label>
          <Select
            value={statusFilter || "all-status"}
            onValueChange={(val) => setStatusFilter(val === "all-status" ? "" : (val as TechnicianStatus))}
          >
            <SelectTrigger className="h-9 w-[180px] border-border/60 bg-background/50 text-sm focus:ring-1 focus:ring-primary">
              <SelectValue placeholder="Chọn trạng thái" />
            </SelectTrigger>
            <SelectContent position="popper" className="rounded-lg">
              <SelectItem value="all-status">Tất cả trạng thái</SelectItem>
              <SelectItem value="AVAILABLE">Sẵn sàng</SelectItem>
              <SelectItem value="UNAVAILABLE">Không sẵn sàng</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
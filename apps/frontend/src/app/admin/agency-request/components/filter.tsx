"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ListFilter, RotateCcw, Tag, User, Mail, Search , Fingerprint} from "lucide-react";

interface AgencyFiltersProps {
  status: string;
  setStatus: (value: string) => void;
  agencyName: string;
  setAgencyName: (value: string) => void;
  requesterEmail: string;
  setRequesterEmail: (value: string) => void;
  requesterUserId: string; // Thêm dòng này
  setRequesterUserId: (value: string) => void; // Thêm dòng này
  onReset?: () => void;
}

export function AgencyFilters({
  status,
  setStatus,
  agencyName,
  setAgencyName,
  requesterEmail,
  setRequesterEmail,
  requesterUserId, // Thêm dòng này
  setRequesterUserId, // Thêm dòng này
  onReset,
}: AgencyFiltersProps) {
  
  const isFiltering = status !== "all" || agencyName !== "" || requesterEmail !== "" || requesterUserId !== "";

  const handleReset = () => {
    setStatus("all");
    setAgencyName("");
    setRequesterEmail("");
    setRequesterUserId("");
    if (onReset) onReset();
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm transition-all mb-6">
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
        
        {/* Lọc Trạng thái */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Tag className="h-3 w-3" />
            Trạng thái
          </label>
          <Select
            value={status}
            onValueChange={(val) => setStatus(val)}
          >
            <SelectTrigger className="h-9 w-[160px] border-border/60 bg-background/50 text-sm focus:ring-1 focus:ring-primary">
              <SelectValue placeholder="Chọn trạng thái" />
            </SelectTrigger>
            <SelectContent position="popper" className="rounded-lg shadow-xl">
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="PENDING">Đang chờ</SelectItem>
              <SelectItem value="APPROVED">Đã duyệt</SelectItem>
              <SelectItem value="REJECTED">Đã từ chối</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lọc Tên Agency */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Search className="h-3 w-3" />
            Tên Agency
          </label>
          <div className="relative">
            <Input
              placeholder="Tìm tên agency..."
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              className="h-9 w-[200px] border-border/60 bg-background/50 text-sm focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>

        {/* Lọc Email người yêu cầu */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Mail className="h-3 w-3" />
            Email người gửi
          </label>
          <Input
            placeholder="example@gmail.com"
            value={requesterEmail}
            onChange={(e) => setRequesterEmail(e.target.value)}
            className="h-9 w-[220px] border-border/60 bg-background/50 text-sm focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Fingerprint className="h-3 w-3" /> {/* Bạn có thể import Fingerprint từ lucide-react */}
            User ID
          </label>
          <Input
            placeholder="Nhập User ID..."
            value={requesterUserId}
            onChange={(e) => setRequesterUserId(e.target.value)}
            className="h-9 w-[180px] border-border/60 bg-background/50 text-sm focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </div>
    </div>
  );
}
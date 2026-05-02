"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { redistributionColumn } from "@/columns/distribution-request-column";
import { TableSkeleton } from "@/components/table-skeleton";
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
  ListFilter, RotateCcw, Activity, MapPin, User, Search 
} from "lucide-react";
import type { RedistributionRequest, RedistributionRequestStatus } from "@/types/DistributionRequest";
import type { Pagination, Station } from "@custom-types";

interface DistributionRequestClientProps {
  data: {
    requests: RedistributionRequest[];
    pagination?: Pagination;
    isVisualLoading: boolean;
    stations: Station[]; // Cần truyền thêm list trạm để chọn Source/Target
  };
  filters: {
    statusFilter: RedistributionRequestStatus | "all";
    page: number;
    requestedByUserId: string;
    sourceStationId: string;
    targetStationId: string;
  };
  actions: {
    setStatusFilter: Dispatch<SetStateAction<RedistributionRequestStatus | "all">>;
    setPage: Dispatch<SetStateAction<number>>;
    setRequestedByUserId: Dispatch<SetStateAction<string>>;
    setSourceStationId: Dispatch<SetStateAction<string>>;
    setTargetStationId: Dispatch<SetStateAction<string>>;
    handleReset: () => void;
  };
}

export default function DistributionRequestClient({
  data: { requests, pagination, isVisualLoading, stations },
  filters,
  actions,
}: DistributionRequestClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const isFiltering = 
    filters.statusFilter !== "all" || 
    filters.requestedByUserId !== "" || 
    filters.sourceStationId !== "all" || 
    filters.targetStationId !== "all";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý điều phối xe</h1>
          <p className="text-muted-foreground mt-1">Theo dõi và quản lý các yêu cầu luân chuyển xe trong hệ thống</p>
        </div>
      </div>

      {/* --- BỘ LỌC UI ĐỒNG BỘ --- */}
      <div className="rounded-xl border border-border bg-card shadow-sm transition-all">
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

        <div className="flex flex-wrap items-center gap-6 p-4">
          {/* Trạng thái */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Activity className="h-3 w-3" /> Trạng thái
            </label>
            <Select
              value={filters.statusFilter}
              onValueChange={(val) => {
                actions.setStatusFilter(val as any);
                actions.setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[180px] bg-background/50 text-sm">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="PENDING_APPROVAL">Chờ phê duyệt</SelectItem>
                <SelectItem value="APPROVED">Đã phê duyệt</SelectItem>
                <SelectItem value="IN_TRANSIT">Đang vận chuyển</SelectItem>
                <SelectItem value="COMPLETED">Đã hoàn thành</SelectItem>
                <SelectItem value="REJECTED">Đã từ chối</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Trạm nguồn */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <MapPin className="h-3 w-3" /> Trạm nguồn
            </label>
            <Select
              value={filters.sourceStationId || "all"}
              onValueChange={(val) => actions.setSourceStationId(val === "all" ? "" : val)}
            >
              <SelectTrigger className="h-9 w-[200px] bg-background/50 text-sm">
                <SelectValue placeholder="Chọn trạm đi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả các trạm</SelectItem>
                {stations?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trạm đích */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <MapPin className="h-3 w-3" /> Trạm đích
            </label>
            <Select
              value={filters.targetStationId || "all"}
              onValueChange={(val) => actions.setTargetStationId(val === "all" ? "" : val)}
            >
              <SelectTrigger className="h-9 w-[200px] bg-background/50 text-sm">
                <SelectValue placeholder="Chọn trạm đến" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả các trạm</SelectItem>
                {stations?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Người yêu cầu */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <User className="h-3 w-3" /> Người yêu cầu
            </label>
            <Input
              placeholder="Nhập User ID..."
              value={filters.requestedByUserId}
              onChange={(e) => actions.setRequestedByUserId(e.target.value)}
              className="h-9 w-[160px] bg-background/50 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="min-h-[600px] space-y-4">
        {isVisualLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <p className="text-sm text-muted-foreground ml-1">
              Hiển thị {pagination?.page ?? 1} / {pagination?.totalPages ?? 1} trang
            </p>

            <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
              <DataTable
                title="Danh sách yêu cầu điều phối"
                columns={redistributionColumn({
                  onView: ({ id }) => router.push(`/admin/distribution-request/detail/${id}`),
                })}
                data={requests || []}
                searchValue={searchQuery}
                filterPlaceholder="Tìm kiếm mã yêu cầu..."
                onSearchChange={setSearchQuery}
              />
            </div>

            <div className="pt-3">
              <PaginationDemo
                currentPage={filters.page}
                totalPages={pagination?.totalPages ?? 1}
                onPageChange={actions.setPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
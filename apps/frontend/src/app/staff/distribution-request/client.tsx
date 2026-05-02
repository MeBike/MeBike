"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { redistributionColumn } from "@/columns/distribution-request-column";
import { TableSkeleton } from "@/components/table-skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListFilter, RotateCcw, Activity, Plus } from "lucide-react"; // Thêm Plus icon
import type { RedistributionRequest, RedistributionRequestStatus } from "@/types/DistributionRequest";
import type { Pagination } from "@custom-types";

interface DistributionRequestClientProps {
  data: {
    requests: RedistributionRequest[];
    pagination?: Pagination;
    isVisualLoading: boolean;
  };
  filters: {
    statusFilter: RedistributionRequestStatus | "all";
    page: number;
  };
  actions: {
    setStatusFilter: Dispatch<SetStateAction<RedistributionRequestStatus | "all">>;
    setPage: Dispatch<SetStateAction<number>>;
    handleReset: () => void;
  };
}

export default function DistributionRequestClient({
  data: { requests, pagination, isVisualLoading },
  filters: { statusFilter, page },
  actions: { setStatusFilter, setPage, handleReset },
}: DistributionRequestClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const isFiltering = statusFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Header - Trả lại nút Tạo yêu cầu cho Tấn đù đây */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Điều phối xe tại trạm</h1>
          <p className="text-muted-foreground mt-1">Theo dõi và tạo các yêu cầu luân chuyển xe cho trạm của bạn</p>
        </div>
        <Button onClick={() => router.push("/staff/distribution-request/create")}>
          <Plus className="mr-2 h-4 w-4" /> Tạo yêu cầu
        </Button>
      </div>

      {/* --- BỘ LỌC ĐỒNG BỘ --- */}
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
              onClick={handleReset}
              className="h-8 w-8 rounded-full p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-6 p-4">
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Activity className="h-3 w-3" /> Trạng thái yêu cầu
            </label>
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val as any);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[220px] bg-background/50 text-sm focus:ring-1 focus:ring-primary">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="PENDING_APPROVAL">Chờ phê duyệt</SelectItem>
                <SelectItem value="APPROVED">Đã phê duyệt</SelectItem>
                <SelectItem value="IN_TRANSIT">Đang vận chuyển</SelectItem>
                <SelectItem value="COMPLETED">Đã hoàn thành</SelectItem>
                <SelectItem value="REJECTED">Đã từ chối</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
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
                  onView: ({ id }) => router.push(`/staff/distribution-request/detail/${id}`),
                })}
                data={requests || []}
                searchValue={searchQuery}
                filterPlaceholder="Tìm kiếm mã yêu cầu..."
                onSearchChange={setSearchQuery}
              />
            </div>

            <div className="pt-3">
              <PaginationDemo
                currentPage={page}
                totalPages={pagination?.totalPages ?? 1}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
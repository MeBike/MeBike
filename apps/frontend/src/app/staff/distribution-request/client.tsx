"use client";

import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { redistributionColumn } from "@/columns/distribution-request-column";
import { TableSkeleton } from "@/components/table-skeleton";
import { Button } from "@/components/ui/button";
import type { RedistributionRequest, RedistributionRequestStatus } from "@/types/DistributionRequest";
import type { Pagination } from "@custom-types";
import { Plus } from "lucide-react";
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
  };
}

export default function DistributionRequestClient({
  data: { requests, pagination, isVisualLoading },
  filters: { statusFilter, page },
  actions: { setPage, setStatusFilter },
}: DistributionRequestClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleReset = () => {
    setStatusFilter("all");
    setPage(1);
    setSearchQuery("");
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Tiêu đề */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Quản lý điều phối xe
          </h1>
          <p className="text-muted-foreground mt-1">
            Theo dõi và quản lý các yêu cầu luân chuyển xe trong hệ thống
          </p>
        </div>
        <Button onClick={() => router.push("/staff/distribution-request/create")}>
          <Plus className="mr-2 h-4 w-4" /> Tạo yêu cầu điều phối
        </Button>
      </div>

      {/* 2. Khối Bộ Lọc (Giống y chang bên Customer) */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Bộ lọc</h3>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Xóa bộ lọc
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Trạng thái yêu cầu</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as RedistributionRequestStatus | "all");
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Tất cả</option>
              <option value="PENDING_APPROVAL">Chờ phê duyệt</option>
              <option value="APPROVED">Đã phê duyệt</option>
              <option value="IN_TRANSIT">Đang vận chuyển</option>
              <option value="COMPLETED">Đã hoàn thành</option>
              <option value="REJECTED">Đã từ chối</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Khối Danh sách (Khối riêng tách biệt) */}
      <div className="min-h-[600px] space-y-4">
        {isVisualLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <p className="text-sm text-muted-foreground ml-1">
              Hiển thị {pagination?.page ?? 1} / {pagination?.totalPages ?? 1} trang
            </p>

            <div className="bg-card border border-border rounded-lg p-0 overflow-hidden shadow-sm">
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
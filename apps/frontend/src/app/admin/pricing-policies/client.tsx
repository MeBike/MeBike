"use client";

import { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { pricingPolicyColumns } from "@/columns/pricing-policy-column"; // Giả định bạn đã tạo file này
import { TableSkeleton } from "@/components/table-skeleton";
import type { PricingPolicy, PricingPolicyStatus, Pagination } from "@/types";

// 1. Định nghĩa Interface cho PricingPolicyClient
interface PricingPolicyClientProps {
  data: {
    policies: PricingPolicy[];
    pagination?: Pagination;
    isLoading: boolean;
  };
  filters: {
    statusFilter: PricingPolicyStatus | "all";
    page: number;
  };
  actions: {
    setStatusFilter: Dispatch<SetStateAction<PricingPolicyStatus | "all">>;
    setPage: Dispatch<SetStateAction<number>>;
  };
}

export default function PricingPolicyClient({
  data: {
    policies,
    pagination,
    isLoading,
  },
  filters: { statusFilter, page },
  actions: { setStatusFilter, setPage },
}: PricingPolicyClientProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý chính sách giá</h1>
          <p className="text-muted-foreground">Thiết lập đơn giá, phí đặt chỗ và tiền cọc cho xe.</p>
        </div>
        <Button onClick={() => router.push("/admin/pricing-policies/create")}>
          <Plus className="mr-2 h-4 w-4" /> Thêm chính sách
        </Button>
      </div>

      {/* Bộ lọc (Filters) */}
      <div className="flex items-center gap-4">
        {/* Bạn có thể tạo component PricingPolicyFilters riêng hoặc dùng Select đơn giản ở đây */}
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value as PricingPolicyStatus | "all")}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="INACTIVE">Ngừng hoạt động</option>
          <option value="SUSPENDED">Tạm dừng</option>
          <option value="BANNED">Bị cấm</option>
        </select>
      </div>

      {/* Bảng dữ liệu */}
      <div className="min-h-[600px]">
        {isLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              Hiển thị trang {pagination?.page ?? 1} / {pagination?.totalPages ?? 1}
            </p>

            <DataTable
              columns={pricingPolicyColumns({
                onView: ({ id }) => router.push(`/admin/pricing-policies/detail/${id}`),
              })}
              data={policies || []}
            />
            {pagination && pagination.totalPages > 1 && (
              <div className="pt-3">
                <PaginationDemo
                  currentPage={page}
                  onPageChange={setPage}
                  totalPages={pagination.totalPages}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
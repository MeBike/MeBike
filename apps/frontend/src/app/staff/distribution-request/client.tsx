"use client";

import { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { redistributionColumn } from "@/columns/distribution-request-column";
import { TableSkeleton } from "@/components/table-skeleton";
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
  };
}

export default function DistributionRequestClient({
  data: {
    requests,
    pagination,
    isVisualLoading,
  },
  filters: { page },
  actions: { setPage },
}: DistributionRequestClientProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Yêu cầu điều phối</h1>
          <p className="text-muted-foreground text-sm">Quản lý việc luân chuyển xe giữa các trạm</p>
        </div>
      </div>

      <div className="min-h-[600px]">
        {isVisualLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
              <p>
                Hiển thị {pagination?.page ?? 1} / {pagination?.totalPages ?? 1} trang
              </p>
            </div>
            <DataTable
              columns={redistributionColumn({
                onView: ({ id }) => router.push(`/staff/distribution-request/detail/${id}`),
              })}
              data={requests}
            />
            <div className="pt-6">
              <PaginationDemo
                currentPage={pagination?.page ?? 1}
                onPageChange={setPage}
                totalPages={pagination?.totalPages ?? 1}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
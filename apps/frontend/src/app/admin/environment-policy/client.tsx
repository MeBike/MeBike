"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { redistributionColumn } from "@/columns/environment-policy-column"; // Đã import file cột của bạn
import { useEnvironmentPolicy } from "@/hooks/use-environment-policy";
import { TableSkeleton } from "@/components/table-skeleton";

export default function Client() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const {
    dataEnvironmentPolicy,
    isLoadingEnvironmentPolicy,
    getEnvironmentPolicies,
  } = useEnvironmentPolicy({
    hasToken: true,
    pageSize: 7,
    page: page,
  });

  // Load dữ liệu khi trang thay đổi
  useEffect(() => {
    getEnvironmentPolicies();
  }, [page, getEnvironmentPolicies]);

  // Loading state giả lập để UX mượt hơn
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(false);
  useEffect(() => {
    if (isLoadingEnvironmentPolicy) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingEnvironmentPolicy]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Chính sách Môi trường</h1>
        <Button onClick={() => router.push("/admin/environment-policy/create")}>
          <Plus className="w-4 h-4 mr-2" /> Thêm chính sách
        </Button>
      </div>

      <div className="min-h-[700px]">
        {isVisualLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Hiển thị trang {dataEnvironmentPolicy?.pagination?.page ?? 1} /{" "}
              {dataEnvironmentPolicy?.pagination?.totalPages ?? 1}
            </p>
            
            <DataTable
              columns={redistributionColumn({
                onView: ({ id }) =>
                  router.push(`/admin/environment-policy/detail/${id}`),
              })}
              data={dataEnvironmentPolicy?.data || []}
            />
            
            <div className="pt-3">
              <PaginationDemo
                currentPage={dataEnvironmentPolicy?.pagination?.page ?? 1}
                onPageChange={setPage}
                totalPages={dataEnvironmentPolicy?.pagination?.totalPages ?? 1}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
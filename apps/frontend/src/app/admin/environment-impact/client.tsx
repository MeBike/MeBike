"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { co2RecordColumn } from "@/columns/environment-impact-column";
import { useEnvironmentPolicy } from "@/hooks/use-environment-policy";
import { TableSkeleton } from "@/components/table-skeleton";
// import { Button } from "@/components/ui/button";
// import { Plus } from "lucide-react";

export default function Client() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  
  // 1. Destructure các hàm và state của Environment Impacts
  const {
    dataEnvironmentImpacts,
    isLoadingEnvironmentImpacts,
    getEnvironmentImpacts,
  } = useEnvironmentPolicy({
    hasToken: true,
    pageSize: 7,
    page: page,
  });

  // 2. Load dữ liệu khi trang thay đổi
  useEffect(() => {
    getEnvironmentImpacts();
  }, [page, getEnvironmentImpacts]);

  // Loading state giả lập để UX mượt hơn
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(false);
  useEffect(() => {
    if (isLoadingEnvironmentImpacts) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingEnvironmentImpacts]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Lịch sử Tác động Môi trường (CO2)</h1>
        
        {/* Nút Thêm thường không dùng cho Lịch sử (Log), nhưng bạn có thể mở lại nếu cần */}
        {/* <Button onClick={() => router.push("/admin/environment-impact/create")}>
          <Plus className="w-4 h-4 mr-2" /> Thêm bản ghi
        </Button> */}
      </div>

      <div className="min-h-[700px]">
        {isVisualLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Hiển thị trang {dataEnvironmentImpacts?.pagination?.page ?? 1} /{" "}
              {dataEnvironmentImpacts?.pagination?.totalPages ?? 1}
            </p>
            
            <DataTable
              columns={co2RecordColumn({
                // 3. Đổi đường dẫn router.push sang trang detail của impact
                onView: ({ id }) =>
                  router.push(`/admin/environment-impact/detail/${id}`),
              })}
              // 4. Truyền dataEnvironmentImpacts vào bảng
              data={dataEnvironmentImpacts?.data || []}
            />
            
            <div className="pt-3">
              <PaginationDemo
                currentPage={dataEnvironmentImpacts?.pagination?.page ?? 1}
                onPageChange={setPage}
                totalPages={dataEnvironmentImpacts?.pagination?.totalPages ?? 1}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
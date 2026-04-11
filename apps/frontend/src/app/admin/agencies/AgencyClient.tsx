"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { agencyColumn } from "@/columns/agency-column";
import { AgencyActionProps, useAgencyActions } from "@/hooks/use-agency";
import { TableSkeleton } from "@/components/table-skeleton";
export default function AgencyClient() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { agencies, isLoadingAgencies, getAgencies } = useAgencyActions({
    hasToken: true,
    pageSize: 7,
    page: page,
  });
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(false);
  useEffect(() => {
    if (isLoadingAgencies) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingAgencies]);
  useEffect(() => {
    getAgencies();
  }, [getAgencies]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Agency</h1>
        <Button onClick={() => router.push("/admin/bikes/create")}>
          <Plus className="w-4 h-4 mr-2" /> Thêm agency
        </Button>
      </div>
      <div className="min-h-[700px]">
        {isVisualLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Hiển thị {agencies?.pagination?.page ?? 1} /{" "}
              {agencies?.pagination?.totalPages ?? 1} trang
            </p>
            <DataTable
              columns={agencyColumn({
                onView: ({ id }) => router.push(`/admin/bikes/detail/${id}`),
                onEdit: ({ id }) => router.push(`/admin/bikes/${id}?edit=true`),
              })}
              data={agencies?.data || []}
            />
            <div className="pt-3">
              <PaginationDemo
                currentPage={agencies?.pagination?.page ?? 1}
                onPageChange={setPage}
                totalPages={agencies?.pagination?.totalPages ?? 1}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

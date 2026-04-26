
"use client";

import { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { columns } from "@/columns/technician-team-column";
import { TableSkeleton } from "@/components/table-skeleton";
import type { TechnicianTeamRecord , Pagination, TechnicianStatus } from "@custom-types";

// Định nghĩa cấu trúc Props
interface BikeClientProps {
  data: {
    technicianTeam: TechnicianTeamRecord[];
    paginationBikes?: Pagination;
    isVisualLoading: boolean;
    isLoadingStatusCount: boolean;
  };
  filters: {
    statusFilter: TechnicianStatus;
    page: number;
  };
  actions: {
    setStatusFilter: Dispatch<SetStateAction<TechnicianStatus | "all">>;
    setPage: Dispatch<SetStateAction<number>>;
  };
}

export default function Client({
  data: {
    technicianTeam,
    paginationBikes,
    isVisualLoading,
    isLoadingStatusCount,
  },
  filters: { statusFilter, page },
  actions: { setStatusFilter, setPage },
}: BikeClientProps) {
  const router = useRouter();

  if (isLoadingStatusCount) {
    return <Loader2 className="m-auto animate-spin" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quản lý xe đạp</h1>
        <Button onClick={() => router.push("/admin/bikes/create")}>
          <Plus className="mr-2 h-4 w-4" /> Thêm xe
        </Button>
      </div>
      <div className="min-h-[700px]">
        {isVisualLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              Hiển thị {paginationBikes?.page ?? 1} /{" "}
              {paginationBikes?.totalPages ?? 1} trang
            </p>

            <DataTable
              columns={columns({
                onView: ({ id }) => router.push(`/admin/technician-team/detail/${id}`),
                onChangeStatus: (id, newStatus) => {
                  // Gọi API hoặc th
                  
                }
              })}
              data={technicianTeam}
            />

            <div className="pt-3">
              <PaginationDemo
                currentPage={paginationBikes?.page ?? 1}
                onPageChange={setPage}
                totalPages={paginationBikes?.totalPages ?? 1}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
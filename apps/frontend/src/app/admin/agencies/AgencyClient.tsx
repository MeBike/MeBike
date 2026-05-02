"use client";
import { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { agencyColumn } from "@/columns/agency-column";
import { TableSkeleton } from "@/components/table-skeleton";
import { AgencyFilters } from "./components/filter"; // Sắp tạo bên dưới
import { ApiResponse, Agency, AgencyStatus } from "@/types";

interface AgencyClientProps {
  isVisualLoading: boolean;
  agencies?: ApiResponse<Agency[]>;
  filters: {
    name: string;
    stationAddress: string;
    contactPhone: string;
    contactName: string;
    status: AgencyStatus | "all";
    page: number;
  };
  actions: {
    setName: Dispatch<SetStateAction<string>>;
    setStationAddress: Dispatch<SetStateAction<string>>;
    setContactPhone: Dispatch<SetStateAction<string>>;
    setContactName: Dispatch<SetStateAction<string>>;
    setStatus: Dispatch<SetStateAction<AgencyStatus | "all">>;
    setPage: Dispatch<SetStateAction<number>>;
    handleReset: () => void;
  };
}

export default function AgencyClient({ isVisualLoading, agencies, filters, actions }: AgencyClientProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Agency</h1>
          <p className="text-muted-foreground mt-1">Quản lý danh sách các đại lý và trạm xe liên kết</p>
        </div>
        <Button onClick={() => router.push("/admin/agencies/create")}>
          <Plus className="w-4 h-4 mr-2" /> Thêm agency
        </Button>
      </div>

      {/* --- BỘ LỌC ĐỒNG BỘ --- */}
      <AgencyFilters filters={filters} actions={actions} />

      <div className="min-h-[700px]">
        {isVisualLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Hiển thị {agencies?.pagination?.page ?? 1} / {agencies?.pagination?.totalPages ?? 1} trang
            </p>
            <DataTable
              columns={agencyColumn({
                onView: ({ id }) => router.push(`/admin/agencies/detail/${id}`),
                onEdit: ({ id }) => router.push(`/admin/agencies/edit/${id}`),
              })}
              data={agencies?.data || []}
            />
            <div className="pt-3">
              <PaginationDemo
                currentPage={agencies?.pagination?.page ?? 1}
                onPageChange={actions.setPage}
                totalPages={agencies?.pagination?.totalPages ?? 1}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
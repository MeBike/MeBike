"use client";

import { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { columns } from "@/columns/technician-team-column";
import { TableSkeleton } from "@/components/table-skeleton";
import { TechnicianTeamFilters } from "./components/filter";
import type { 
  TechnicianTeamRecord, 
  Pagination, 
  TechnicianStatus, 
  Station 
} from "@custom-types";

interface TechnicianClientProps {
  data: {
    technicianTeam: TechnicianTeamRecord[];
    pagination?: Pagination;
    stations: Station[];
    isVisualLoading: boolean;
  };
  filters: {
    statusFilter: TechnicianStatus | "";
    stationId: string;
    page: number;
  };
  actions: {
    setStatusFilter: Dispatch<SetStateAction<TechnicianStatus | "">>;
    setStationId: Dispatch<SetStateAction<string>>;
    setPage: Dispatch<SetStateAction<number>>;
  };
}

export default function Client({
  data: {
    technicianTeam,
    pagination,
    stations,
    isVisualLoading,
  },
  filters: { statusFilter, stationId, page },
  actions: { setStatusFilter, setStationId, setPage },
}: TechnicianClientProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý đội kỹ thuật</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Điều phối và quản lý nhân sự tại các trạm xe.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/technician-teams/create")} className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Thêm đội kỹ thuật
        </Button>
      </div>
      <TechnicianTeamFilters
        stationId={stationId}
        setStationId={setStationId}
        stations={stations}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onReset={() => {
          setStationId("all-stations");
          setStatusFilter("");
        }}
      />
      <div className="min-h-[500px]">
        {isVisualLoading ? (
          <TableSkeleton />
        ) : (
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <p className="text-xs text-muted-foreground">
                Hiển {pagination?.page ?? 1} / {pagination?.totalPages ?? 1}
              </p>
            </div>
            <div className="">
              <DataTable
                columns={columns({
                  onView: ({ id }) => router.push(`/admin/technician-teams/detail/${id}`),
                })}
                data={technicianTeam}
              />
            </div>

            <div className="flex justify-center pt-4">
              <PaginationDemo
                currentPage={pagination?.page ?? 1}
                onPageChange={setPage}
                totalPages={pagination?.totalPages ?? 1}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
"use client";

import { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { bikeColumnForStaff } from "@/columns/bike-colums";
import { BikeFilters } from "./components/bike-filter";
import { TableSkeleton } from "@/components/table-skeleton";
import type { Bike, BikeStatus, Pagination, Station, Supplier } from "@custom-types";

interface BikeClientProps {
  data: {
    bikes: Bike[];
    pagination?: Pagination;
    stations: Station[];
    isVisualLoading: boolean;
  };
  filters: {
    statusFilter: BikeStatus | "all";
    page: number;
    stationId: string;
    supplierId: string;
  };
  actions: {
    setStatusFilter: Dispatch<SetStateAction<BikeStatus | "all">>;
    setPage: Dispatch<SetStateAction<number>>;
    setStationId: Dispatch<SetStateAction<string>>;
    setSupplierId: Dispatch<SetStateAction<string>>;
    handleReset: () => void;
  };
}

export default function BikeClient({
  data: { bikes, pagination, stations, isVisualLoading },
  filters,
  actions,
}: BikeClientProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý xe đạp (Agency)</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý và theo dõi trạng thái xe đạp thuộc hệ thống Agency
          </p>
        </div>
      </div>

      {/* --- SỬ DỤNG LẠI COMPONENT FILTER ĐÃ ĐỒNG BỘ --- */}
      <BikeFilters
        statusFilter={filters.statusFilter}
        setStatusFilter={actions.setStatusFilter}
        stationId={filters.stationId}
        setStationId={actions.setStationId}
        stations={stations}
        onReset={actions.handleReset}
      />

      <div className="min-h-[700px]">
        {isVisualLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Hiển thị {pagination?.page ?? 1} / {pagination?.totalPages ?? 1} trang
            </p>
            <DataTable
              columns={bikeColumnForStaff({
                onView: ({ id }) => router.push(`/agency/bikes/detail/${id}`),
              })}
              data={bikes}
              title="Danh sách xe đạp"
            />
            <div className="pt-3">
              <PaginationDemo
                currentPage={pagination?.page ?? 1}
                onPageChange={actions.setPage}
                totalPages={pagination?.totalPages ?? 1}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
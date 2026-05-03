"use client";

import { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { bikeColumnForStaff } from "@/columns/bike-colums";
import { BikeFilters } from "./components/bike-filter";
import { TableSkeleton } from "@/components/table-skeleton";
import type { Bike, BikeStatus, Pagination } from "@custom-types";

interface BikeClientProps {
  data: {
    bikes: Bike[];
    pagination?: Pagination;
    isVisualLoading: boolean;
  };
  filters: {
    statusFilter: BikeStatus | "all";
    page: number;
  };
  actions: {
    setStatusFilter: Dispatch<SetStateAction<BikeStatus | "all">>;
    setPage: Dispatch<SetStateAction<number>>;
  };
}

export default function BikeClient({
  data: { bikes, pagination, isVisualLoading },
  filters: { statusFilter, page },
  actions: { setStatusFilter, setPage },
}: BikeClientProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý xe đạp</h1>
          <p className="text-muted-foreground mt-1">Danh sách xe đạp đang có tại trạm của bạn</p>
        </div>
      </div>

      <BikeFilters
        statusFilter={statusFilter}
        setStatusFilter={(status) => {
          setStatusFilter(status);
          setPage(1); 
        }}
        stations={[]}
        suppliers={[]}
        stationId=""
        setStationId={() => {}}
        supplierId=""
        setSupplierId={() => {}}
      />

      <div className="min-h-[700px]">
        {isVisualLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Hiển thị {pagination?.page ?? 1} / {pagination?.totalPages ?? 1} trang
              </p>
            </div>
            <DataTable
              columns={bikeColumnForStaff({
                onView: ({ id }) => router.push(`/manager/bikes/detail/${id}`),
              })}
              data={bikes}
              title="Xe đạp tại trạm"
            />

            <div className="pt-3">
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
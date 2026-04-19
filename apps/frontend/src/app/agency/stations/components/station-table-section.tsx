"use client";

import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { stationStaffColumns } from "@/columns/station-column";
import { Button } from "@/components/ui/button";
import { Pagination, Station } from "@/types";
interface StationTableSectionProps {
  stations: Station[];
  pagination?: Pagination;
  setPage: (page: number) => void;
  onView : (id:string) => void;
  isLoading?: boolean;
}
export function StationTableSection({
  stations,
  pagination,
  setPage,
  onView,
  isLoading = false,
}: StationTableSectionProps) {
  return (
    <div className="space-y-4">

      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <DataTable
          title="Danh sách trạm xe"
          columns={stationStaffColumns({
            onView : ({id}) => {
              onView(id);
            }
          })}
          isLoading={isLoading}
          data={stations ?? []}
        />
      </div>
      <div className="flex items-center justify-center py-4">
        <div className="order-1 md:order-2">
          <PaginationDemo
            totalPages={pagination?.totalPages ?? 1}
            currentPage={pagination?.page ?? 1}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}

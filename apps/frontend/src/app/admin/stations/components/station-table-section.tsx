"use client";

import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { stationStaffColumns } from "@/columns/station-column";
import { Button } from "@/components/ui/button";
import { Pagination, Station } from "@/types";
import { string } from "zod";
interface StationTableSectionProps {
  distributionConfig : string;
  stations: Station[];
  pagination?: Pagination;
  setPage: (page: number) => void;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  isLoading?: boolean;
  searchQuery?: string;
  setSearchQuery?: (searchQuery: string) => void;
}
export function StationTableSection({
  stations,
  distributionConfig,
  pagination,
  setPage,
  onView,
  onDelete,
  onEdit,
  isLoading = false,
  searchQuery = "",
  setSearchQuery = () => {},
}: StationTableSectionProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <DataTable
          title="Danh sách trạm xe"
          columns={stationStaffColumns({
            onView: ({ id }) => {
              onView(id);
            },
            distributionConfig : distributionConfig
          })}
          isLoading={isLoading}
          data={stations ?? []}
          searchValue={searchQuery}
          filterPlaceholder="Tìm kiếm theo tên trạm"
          onSearchChange={setSearchQuery}
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

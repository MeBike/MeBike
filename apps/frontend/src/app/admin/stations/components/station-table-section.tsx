"use client";

import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { stationColumns } from "@/columns/station-column";
import { Button } from "@/components/ui/button";

interface StationTableSectionProps {
  stations: any[];
  pagination: any;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  setPage: (page: number) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  isLoading?: boolean;
}

export function StationTableSection({
  stations,
  pagination,
  searchQuery,
  setSearchQuery,
  setPage,
  onDelete,
  onEdit,
  isLoading = false,
}: StationTableSectionProps) {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 shadow-sm">
        <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc địa chỉ trạm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
        </div>
        <Button variant="outline" onClick={() => setSearchQuery("")}>Đặt lại</Button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <DataTable
          title="Danh sách trạm xe"
          columns={stationColumns({
            onDelete: ({ id }) => onDelete(id),
            onEdit: ({ id }) => onEdit(id),
          })}
          isLoading={isLoading}
          data={stations ?? []}
        />
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2">
        <p className="text-sm text-muted-foreground order-2 md:order-1">
          Hiển thị <b>{pagination?.total ?? 0}</b> trạm (Trang {pagination?.page}/{pagination?.totalPages})
        </p>
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
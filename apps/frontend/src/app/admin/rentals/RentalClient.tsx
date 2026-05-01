"use client";

import { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { RentalFilters } from "@/components/rentals/rental-filters";
import { RentalStats } from "@/components/rentals/rental-stats";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { rentalColumn } from "@/columns/rental-columns";
import { TableSkeleton } from "@/components/table-skeleton";
import type { RentalStatus } from "@custom-types";
import type { Rental , Pagination , SummaryRental , Station} from "@custom-types";
interface RentalClientProps {
  data: {
    rentals: Rental[];
    summaryRental?: SummaryRental;
    pagination?: Pagination;
    isVisualLoading: boolean;
    stations: Station[]; // Thêm
  };
  filters: {
    searchQuery: string;
    statusFilter: RentalStatus | "";
    userId: string;       // Thêm
    bikeId: string;       // Thêm
    startStation: string; // Thêm
    endStation: string;   // Thêm
  };
  actions: {
    setSearchQuery: Dispatch<SetStateAction<string>>;
    setStatusFilter: (status: RentalStatus | "") => void;
    setUserId: Dispatch<SetStateAction<string>>;       // Thêm
    setBikeId: Dispatch<SetStateAction<string>>;       // Thêm
    setStartStation: Dispatch<SetStateAction<string>>; // Thêm
    setEndStation: Dispatch<SetStateAction<string>>;   // Thêm
    setPage: Dispatch<SetStateAction<number>>;
    handleReset: () => void;
  };
}

export default function RentalClient({
  data: { rentals, summaryRental, pagination, isVisualLoading, stations },
  filters,
  actions,
}: RentalClientProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Title & Stats giữ nguyên */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Quản lý đơn thuê</h1>
        <p className="mt-1 text-muted-foreground">Theo dõi và quản lý các phiên thuê xe</p>
      </div>

      {summaryRental && <RentalStats params={summaryRental} />}

      {/* Component Filter mới */}
      <RentalFilters
        stations={stations}
        filters={filters}
        actions={actions}
      />

      {/* Bảng dữ liệu giữ nguyên logic Loading */}
      <div className="min-h-[520px]">
        {isVisualLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              Hiển thị {pagination?.page} / {pagination?.totalPages} trang
            </p>
            <DataTable
              columns={rentalColumn({
                onView: ({ id }) => router.push(`/admin/rentals/detail/${id}`),
              })}
              data={rentals}
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
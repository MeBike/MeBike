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
import type { Rental , Pagination , SummaryRental} from "@custom-types";
interface RentalClientProps {
  data: {
    rentals: Rental[];
    summaryRental?: SummaryRental;
    pagination?: Pagination;
    isVisualLoading: boolean;
  };
  filters: {
    searchQuery: string;
    statusFilter: RentalStatus | "";
  };
  actions: {
    setSearchQuery: Dispatch<SetStateAction<string>>;
    setStatusFilter: Dispatch<SetStateAction<RentalStatus | "">>;
    setPage: Dispatch<SetStateAction<number>>;
    handleReset: () => void;
  };
}

export default function RentalClient({
  data: { rentals, summaryRental, pagination, isVisualLoading },
  filters: { searchQuery, statusFilter },
  actions: { setSearchQuery, setStatusFilter, setPage, handleReset },
}: RentalClientProps) {
  const router = useRouter();

  return (
    <div>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Quản lý đơn thuê
            </h1>
            <p className="mt-1 text-muted-foreground">
              Theo dõi và quản lý các đơn thuê xe đạp
            </p>
          </div>
        </div>

        {summaryRental && <RentalStats params={summaryRental} />}

        <RentalFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          onReset={handleReset}
        />

        <div className="min-h-[520px]">
          {isVisualLoading ? (
            <TableSkeleton />
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                Hiển thị {pagination?.page ?? 1} / {pagination?.totalPages ?? 1}{" "}
                trang
              </p>
              
              <DataTable
                columns={rentalColumn({
                  onView: ({ id }) => {
                    router.push(`/admin/rentals/detail/${id}`);
                  },
                })}
                data={rentals}
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
    </div>
  );
}
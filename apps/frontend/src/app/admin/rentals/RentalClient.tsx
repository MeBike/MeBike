"use client";
import { useState, useEffect } from "react";
import { RentalFilters } from "@/components/rentals/rental-filters";
import { RentalStats } from "@/components/rentals/rental-stats";
import { useRouter } from "next/navigation";
import type { RentalStatus } from "@custom-types";
import { useRentalsActions } from "@/hooks/use-rental";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { rentalColumn } from "@/columns/rental-columns";
import { TableSkeleton } from "@/components/table-skeleton";
export default function RentalClient() {
  const router = useRouter();
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(7);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RentalStatus>("");
  const {
    allRentalsData,
    pagination,
    getTodayRevenue,
    summaryRental,
    getSummaryRental,
    isAllRentalsLoading,
  } = useRentalsActions({
    hasToken: true,
    limit: limit,
    page: page,
    ...(statusFilter !== "" && { status: statusFilter }),
  });
  const [isVisualLoading, setIsVisualLoading] = useState(false);
  useEffect(() => {
    if (isAllRentalsLoading) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isAllRentalsLoading]);
  useEffect(() => {
    getTodayRevenue();
  }, [getTodayRevenue]);
  useEffect(() => {
    getSummaryRental();
  }, [getSummaryRental]);
  const rentals = allRentalsData || [];
  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("");
  };
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);
  return (
    <div>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Quản lý đơn thuê
            </h1>
            <p className="text-muted-foreground mt-1">
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
              <p className="text-sm text-muted-foreground mb-4">
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

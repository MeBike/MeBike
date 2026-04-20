"use client";
import { useState, useEffect } from "react";
import { RentalFilters } from "@/components/rentals/rental-filters";
import { useRouter } from "next/navigation";
import type { RentalStatus } from "@custom-types";
import { useAgencyActions } from "@/hooks/use-agency";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { rentalColumnForStaff } from "@/columns/rental-columns";
import { TableSkeleton } from "@/components/table-skeleton";
export default function RentalClient() {
  const router = useRouter();
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(7);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RentalStatus>("");
  const {
    rentalInMyStation,
    getRentalInMyStation,
    isLoadingRentalInMyStation,
  } = useAgencyActions({
    hasToken: true,
    pageSize: limit,
    page: page,
    ...(statusFilter !== "" && { rental_status: statusFilter }),
  });
  const [isVisualLoading, setIsVisualLoading] = useState(false);
  useEffect(() => {
    if (isLoadingRentalInMyStation) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingRentalInMyStation]);
  const rentals = rentalInMyStation?.data || [];
  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("");
  };
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);
  useEffect(() => {getRentalInMyStation()},[getRentalInMyStation]);
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
        {/* {summaryRental && <RentalStats params={summaryRental} />} */}

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
                Hiển thị {rentalInMyStation?.pagination?.page ?? 1} / {rentalInMyStation?.pagination?.totalPages ?? 1}{" "}
                trang
              </p>
              <DataTable
                columns={rentalColumnForStaff({
                  onView: ({ id }) => {
                    router.push(`/staff/rentals/detail/${id}`);
                  },
                })}
                data={rentals}
              />
              <div className="pt-3">
                <PaginationDemo
                  currentPage={rentalInMyStation?.pagination  ?.page ?? 1}
                  onPageChange={setPage}
                  totalPages={rentalInMyStation?.pagination?.totalPages ?? 1}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { RentalFilters } from "@/components/rentals/rental-filters";
import { useRouter } from "next/navigation";
import type { RentalStatus } from "@custom-types";
import { useRentalsActions } from "@/hooks/use-rental";
import { useStationActions } from "@/hooks/use-station"; // Thêm hook lấy trạm
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { rentalColumnForStaff } from "@/columns/rental-columns";
import { TableSkeleton } from "@/components/table-skeleton";

export default function RentalClient() {
  const router = useRouter();
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(7);
  
  // --- BỔ SUNG CÁC STATE FILTER ---
  const [statusFilter, setStatusFilter] = useState<RentalStatus | "">("");
  const [userId, setUserId] = useState<string>("");
  const [bikeId, setBikeId] = useState<string>("");
  const [startStation, setStartStation] = useState<string>("");
  const [endStation, setEndStation] = useState<string>("");

  const { stations, getAllStations } = useStationActions({ hasToken: true });

  const {
    staffRentalsData,
    isAllRentalsStaffLoading,
    paginationStaffRental,
    getStaffRentals
  } = useRentalsActions({
    hasToken: true,
    limit: limit,
    page: page,
    status: statusFilter as RentalStatus,
    userId,
    bikeId,
    startStation,
    endStation
  });

  const [isVisualLoading, setIsVisualLoading] = useState(false);

  useEffect(() => {
    getAllStations();
  }, [getAllStations]);

  useEffect(() => {
    if (isAllRentalsStaffLoading) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => setIsVisualLoading(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isAllRentalsStaffLoading]);

  // --- CẬP NHẬT HÀM RESET ---
  const handleReset = () => {
    setStatusFilter("");
    setUserId("");
    setBikeId("");
    setStartStation("");
    setEndStation("");
    setPage(1);
  };

  useEffect(() => {
    getStaffRentals();
  }, [getStaffRentals, page, statusFilter, userId, bikeId, startStation, endStation]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Quản lý đơn thuê</h1>

      {/* --- SỬA CÁCH TRUYỀN PROPS Ở ĐÂY --- */}
      <RentalFilters
        stations={stations || []}
        filters={{
          statusFilter,
          userId,
          bikeId,
          startStation,
          endStation,
        }}
        actions={{
          setStatusFilter,
          setUserId,
          setBikeId,
          setStartStation,
          setEndStation,
          handleReset,
        }}
      />

      <div className="min-h-[520px]">
        {isVisualLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Hiển thị {paginationStaffRental?.page ?? 1} / {paginationStaffRental?.totalPages ?? 1} trang
            </p>
            <DataTable
              columns={rentalColumnForStaff({
                onView: ({ id }) => router.push(`/staff/rentals/detail/${id}`),
              })}
              data={staffRentalsData || []}
            />
            <div className="pt-3">
              <PaginationDemo
                currentPage={paginationStaffRental?.page ?? 1}
                onPageChange={setPage}
                totalPages={paginationStaffRental?.totalPages ?? 1}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
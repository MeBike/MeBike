"use client";

import { useState, useEffect } from "react";
import { RentalFilters } from "@/components/rentals/rental-filters";
import { useRouter } from "next/navigation";
import type { RentalStatus } from "@custom-types";
import { useAgencyActions } from "@/hooks/use-agency";
import { useStationActions } from "@/hooks/use-station";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { rentalColumnForStaff } from "@/columns/rental-columns";
import { TableSkeleton } from "@/components/table-skeleton";
import { useDebounce } from "@/utils/useDebounce";
export default function RentalClient() {
  const router = useRouter();
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(7);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RentalStatus | "">("");
  const [userId, setUserId] = useState<string>("");
  const [bikeId, setBikeId] = useState<string>("");
  const [startStation, setStartStation] = useState<string>("");
  const [endStation, setEndStation] = useState<string>("");
  const { stations, getAllStations } = useStationActions({ hasToken: true });
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const debouncedStatusFilter = useDebounce(statusFilter,500);
  const debouncedUserId = useDebounce(userId, 500);
  const debouncedBikeId = useDebounce(bikeId, 500);
  const debouncedStartStation = useDebounce(startStation, 500);
  const debouncedEndStation = useDebounce(endStation, 500);
  const {
    rentalInMyStation,
    getRentalInMyStation,
    isLoadingRentalInMyStation,
  } = useAgencyActions({
    hasToken: true,
    pageSize: limit,
    page: page,
    ...(debouncedStatusFilter !== "" && { rental_status: debouncedStatusFilter as RentalStatus }),
    userId: debouncedUserId || undefined,
    bikeId: debouncedBikeId || undefined,
    startStation: debouncedStartStation || undefined,
    endStation: debouncedEndStation || undefined,
  });

  const [isVisualLoading, setIsVisualLoading] = useState(false);

  // 3. EFFECTS
  useEffect(() => {
    getAllStations();
  }, [getAllStations]);

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

  useEffect(() => {
    getRentalInMyStation();
  }, [
    getRentalInMyStation, 
    page, 
    debouncedStatusFilter, 
    debouncedUserId, 
    debouncedBikeId, 
    debouncedStartStation, 
    debouncedEndStation
  ]);

  useEffect(() => {
    setPage(1);
  }, [debouncedStatusFilter, debouncedUserId, debouncedBikeId, debouncedStartStation, debouncedEndStation]);

  // 4. XỬ LÝ SỰ KIỆN
  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("");
    setUserId("");
    setBikeId("");
    setStartStation("");
    setEndStation("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Quản lý đơn thuê (Agency)
          </h1>
          <p className="text-muted-foreground mt-1">
            Theo dõi và quản lý các phiên thuê xe tại trạm của bạn
          </p>
        </div>
      </div>

      {/* --- BỘ LỌC NÂNG CAO ĐỒNG BỘ --- */}
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
              Hiển thị {rentalInMyStation?.pagination?.page ?? 1} / {rentalInMyStation?.pagination?.totalPages ?? 1} trang
            </p>
            
            <DataTable
              columns={rentalColumnForStaff({
                onView: ({ id }) => {
                  router.push(`/agency/rentals/detail/${id}`);
                },
              })}
              data={rentalInMyStation?.data || []}
              title="Danh sách đơn thuê"
            />
            
            <div className="pt-3">
              <PaginationDemo
                currentPage={rentalInMyStation?.pagination?.page ?? 1}
                onPageChange={setPage}
                totalPages={rentalInMyStation?.pagination?.totalPages ?? 1}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
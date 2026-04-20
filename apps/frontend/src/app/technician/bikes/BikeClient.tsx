"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { useBikeActions } from "@/hooks/use-bike";
import { bikeColumnForStaff } from "@/columns/bike-colums";
import { BikeStatus } from "@custom-types";
import { BikeFilters } from "./components/bike-filter";
import { TableSkeleton } from "@/components/table-skeleton";
export default function BikeClient() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<BikeStatus | "all">("all");
  const {
    myBikeInStation,
    isLoadingMyBikeInStation,
    getMyBikeInStation
  } = useBikeActions({
    hasToken: true,
    status: statusFilter !== "all" ? (statusFilter as BikeStatus) : undefined,
    pageSize: 7,
    page: page,
  });
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(false);
  useEffect(() => {
    if (isLoadingMyBikeInStation) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingMyBikeInStation]);
  useEffect(() => {
    getMyBikeInStation();
  }, [statusFilter]);
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý xe đạp</h1>
      </div>
      <BikeFilters
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />
      <div className="min-h-[700px]">
        {isVisualLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Hiển thị {myBikeInStation?.pagination?.page ?? 1} /{" "}
              {myBikeInStation?.pagination?.totalPages ?? 1} trang
            </p>
            <DataTable
              columns={bikeColumnForStaff({
                onView: ({ id }) => router.push(`/technician/bikes/detail/${id}`),
              })}
              data={myBikeInStation?.data || []}
            />
            <div className="pt-3">
              <PaginationDemo
                currentPage={myBikeInStation?.pagination?.page ?? 1}
                onPageChange={setPage}
                totalPages={myBikeInStation?.pagination?.totalPages ?? 1}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

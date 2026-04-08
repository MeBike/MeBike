"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { useBikeActions } from "@/hooks/use-bike";
import { useStationActions } from "@/hooks/use-station";
import { useSupplierActions } from "@/hooks/use-supplier";
import { bikeColumn } from "@/columns/bike-colums";
import { BikeStatus } from "@custom-types";
import { BikeStats } from "./components/bike-stats";
import { BikeFilters } from "./components/bike-filter";
import { TableSkeleton } from "@/components/table-skeleton";
export default function BikeClient() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<BikeStatus | "all">("all");
  const {
    data,
    paginationBikes,
    isLoadingBikes,
  } = useBikeActions({
    hasToken: true,
    status: statusFilter !== "all" ? (statusFilter as BikeStatus) : undefined,
    pageSize: 7,
    page: page,
  });
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(false);
  useEffect(() => {
    if (isLoadingBikes) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingBikes]);
  useEffect(() => {
    setPage(1);
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
              Hiển thị {paginationBikes?.page ?? 1} /{" "}
              {paginationBikes?.totalPages ?? 1} trang
            </p>
            <DataTable
              columns={bikeColumn({
                onView: ({ id }) => router.push(`/staff/bikes/detail/${id}`),
              })}
              data={data?.data || []}
            />
            <div className="pt-3">
              <PaginationDemo
                currentPage={paginationBikes?.page ?? 1}
                onPageChange={setPage}
                totalPages={paginationBikes?.totalPages ?? 1}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

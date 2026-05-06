"use client";

import { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { bikeColumn } from "@/columns/bike-colums";
import { BikeStats } from "./components/bike-stats";
import { BikeFilters } from "./components/bike-filter";
import { TableSkeleton } from "@/components/table-skeleton";
import type { Bike, BikeStatus, BikeStatistics, Pagination, Station, Supplier } from "@custom-types";

interface BikeClientProps {
  data: {
    bikes: Bike[];
    statusCount?: BikeStatistics;
    paginationBikes?: Pagination;
    isVisualLoading: boolean;
  };
  filters: {
    statusFilter: BikeStatus | "all";
    page: number;
    bikeId: string; // Thêm dòng này
  };
  actions: {
    setStatusFilter: Dispatch<SetStateAction<BikeStatus | "all">>;
    setPage: Dispatch<SetStateAction<number>>;
    setBikeId: Dispatch<SetStateAction<string>>; // Thêm dòng này
  };
}

export default function BikeClient({
  data: {
    bikes,
    paginationBikes,
    isVisualLoading,

  },
  filters: { statusFilter, page, bikeId },
  actions: { setStatusFilter, setPage,setBikeId },
}: BikeClientProps) {
  const router = useRouter();
  
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quản lý xe đạp</h1>
      </div>
      
      <BikeFilters
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        bikeId={bikeId} // Thêm dòng này
        setBikeId={setBikeId} // Thêm dòng này
      />
      
      <div className="min-h-[700px]">
        {isVisualLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              Hiển thị {paginationBikes?.page ?? 1} /{" "}
              {paginationBikes?.totalPages ?? 1} trang
            </p>

            <DataTable
              columns={bikeColumn({
                onView: ({ id }) => router.push(`/manager/bikes/detail/${id}`),
              })}
              data={bikes}
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
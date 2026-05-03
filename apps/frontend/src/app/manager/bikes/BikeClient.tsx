"use client";

import { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { bikeColumnForStaff } from "@/columns/bike-colums";
import { BikeStats } from "./components/bike-stats";
import { BikeFilters } from "./components/bike-filter";
import { TableSkeleton } from "@/components/table-skeleton";
import type { Bike, BikeStatus, BikeStatistics, Pagination, Station, Supplier } from "@custom-types";

// Bổ sung các fields mới vào Interface
interface BikeClientProps {
  data: {
    bikes: Bike[];
    paginationBikes?: Pagination;
    stations: Station[];
    isVisualLoading: boolean;
  };
  filters: {
    statusFilter: BikeStatus | "all";
    page: number;
    stationId: string;
  };
  actions: {
    setStatusFilter: Dispatch<SetStateAction<BikeStatus | "all">>;
    setPage: Dispatch<SetStateAction<number>>;
    setStationId: Dispatch<SetStateAction<string>>;
  };
}

export default function BikeClient({
  data: {
    bikes,
    paginationBikes,
    stations,
    isVisualLoading,
  },
  filters: { statusFilter, page, stationId },
  actions: { setStatusFilter, setPage, setStationId },
}: BikeClientProps) {
  const router = useRouter();
  
  if (isVisualLoading) {
    return <Loader2 className="m-auto animate-spin" />;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quản lý xe đạp</h1>
        <Button onClick={() => router.push("/manager/bikes/create")}>
          <Plus className="mr-2 h-4 w-4" /> Thêm xe
        </Button>
      </div>
      <BikeFilters
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        stationId={stationId}
        setStationId={setStationId}
        stations={stations}
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
              columns={bikeColumnForStaff({
                onView: ({ id }) => router.push(`/manager/bikes/detail/${id}`),
                stations: stations,
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
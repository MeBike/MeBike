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
    stations: Station[];
    suppliers: Supplier[];
    isVisualLoading: boolean;
    isLoadingStatusCount: boolean;
  };
  filters: {
    statusFilter: BikeStatus | "all";
    page: number;
    stationId: string;
    supplierId: string;
    bikeId: string; // Thêm dòng này
  };
  actions: {
    setStatusFilter: Dispatch<SetStateAction<BikeStatus | "all">>;
    setPage: Dispatch<SetStateAction<number>>;
    setStationId: Dispatch<SetStateAction<string>>;
    setSupplierId: Dispatch<SetStateAction<string>>;
    setBikeId: Dispatch<SetStateAction<string>>; // Thêm dòng này
  };
}

export default function BikeClient({
  data: {
    bikes,
    statusCount,
    paginationBikes,
    stations,
    suppliers,
    isVisualLoading,
    isLoadingStatusCount,
  },
  filters: { statusFilter, page, stationId, supplierId, bikeId },
  actions: { setStatusFilter, setPage, setStationId, setSupplierId, setBikeId },
}: BikeClientProps) {
  const router = useRouter();
  
  if (isLoadingStatusCount) {
    return <Loader2 className="m-auto animate-spin" />;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quản lý xe đạp</h1>
        <Button onClick={() => router.push("/admin/bikes/create")}>
          <Plus className="mr-2 h-4 w-4" /> Thêm xe
        </Button>
      </div>
      
      {statusCount && <BikeStats stats={statusCount} />}
      
      <BikeFilters
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        stationId={stationId}
        setStationId={setStationId}
        supplierId={supplierId}
        setSupplierId={setSupplierId}
        bikeId={bikeId} // Thêm dòng này
        setBikeId={setBikeId} // Thêm dòng này
        stations={stations}
        suppliers={suppliers}
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
                onView: ({ id }) => router.push(`/admin/bikes/detail/${id}`),
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
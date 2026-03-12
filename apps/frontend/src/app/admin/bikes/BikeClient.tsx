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
import {BikeFilters} from "./components/bike-filter";

export default function BikeClient() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<BikeStatus | "all">("all");
  const { stations } = useStationActions({ hasToken: true });
  const { allSupplier } = useSupplierActions({ hasToken: true });
  const { data, statisticData, isLoadingStatistics, paginationBikes, getStatisticsBike } = useBikeActions({
    hasToken: true, 
    status: statusFilter !== "all" ? (statusFilter as BikeStatus) : undefined,
    pageSize: 10,
    page: page,
  });

  useEffect(() => { getStatisticsBike(); }, [getStatisticsBike]);

  if (isLoadingStatistics) return <Loader2 className="animate-spin m-auto" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý xe đạp</h1>
        <Button onClick={() => router.push("/admin/bikes/create")}><Plus className="w-4 h-4 mr-2" /> Thêm xe</Button>
      </div>
        {
            statisticData && data &&  (
                <BikeStats stats={statisticData} total={data?.pagination.totalRecords} />
            )
        }
      <BikeFilters statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
      <DataTable
        columns={bikeColumn({
          onView: ({ id }) => router.push(`/admin/bikes/${id}`),
          onEdit: ({ id }) => router.push(`/admin/bikes/${id}?edit=true`),
          stations,
          suppliers: allSupplier?.data || [],
        })}
        data={data?.data || []}
      />
      <PaginationDemo currentPage={paginationBikes?.currentPage ?? 1} onPageChange={setPage} totalPages={paginationBikes?.totalPages ?? 1} />
    </div>
  );
}
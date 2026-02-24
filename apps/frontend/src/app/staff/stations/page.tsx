"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useStationActions } from "@/hooks/use-station";
import "@tomtom-international/web-sdk-maps/dist/maps.css";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { stationColumns } from "@/columns/station-column-staff";

export default function StationsPage() {
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState("");
  const {
    getAllStations,
    stations,
    paginationStations,
  } = useStationActions({
    hasToken: true,
    page: page,
    limit: limit,
    name: searchQuery,
  });

  // LOAD DATA
  useEffect(() => {
    getAllStations();
  }, [limit, page, searchQuery, getAllStations]);

  // UI
  return (
    <div>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Quản lý trạm xe
            </h1>
            <p className="text-muted-foreground mt-1">
              Quản lý danh sách trạm xe đạp
            </p>
          </div>
        </div>

        {/* <div className="grid gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Tổng số trạm</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {paginationStations?.totalRecords}
            </p>
          </div>
        </div> */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc địa chỉ trạm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground"
            />
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Đặt lại
            </Button>
          </div>
        </div>

        <div className="w-full rounded-lg space-y-4 flex flex-col">
          <div>
            <DataTable
              title="Danh sách trạm"
              columns={stationColumns()}
              data={stations ?? []}
            />
          </div>
          <div>
            <PaginationDemo
              totalPages={paginationStations?.totalPages ?? 1}
              currentPage={paginationStations?.page ?? 1}
              onPageChange={setPage}
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Hiển thị {paginationStations?.pageSize} /{" "}
          {paginationStations?.total} trạm
        </p>
      </div>
    </div>
  );
}

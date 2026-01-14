import React, { Dispatch, SetStateAction } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useStationActions } from "@/hooks/use-station";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { stationColumns } from "@/columns/station-column";
export default function StationTableSection({
  page,
  limit,
  searchQuery,
  setSearchQuery,
  setPage,
  router,
  debouncedSearchQuery,
}: {
  page: number;
  limit: number;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setPage: Dispatch<SetStateAction<number>>;
  router: AppRouterInstance;
  debouncedSearchQuery: string;
}) {
  // Hook gọi ở đây mới kích hoạt được Suspense fallback ở cha
  const { stations, paginationStations } = useStationActions({
    page,
    limit,
    name: debouncedSearchQuery,
  });

  return (
    <div className="w-full rounded-lg space-y-4 flex flex-col">
      <DataTable
        title="Danh sách trạm xe"
        columns={stationColumns({
          onView: ({ id }) => router.push(`/admin/stations/detail/${id}`),
        })}
        searchValue={searchQuery}
        filterPlaceholder="Tìm kiếm người dùng"
        onSearchChange={setSearchQuery}
        data={stations}
      />
      <PaginationDemo
        totalPages={paginationStations?.totalPages ?? 1}
        currentPage={paginationStations?.page ?? 1}
        onPageChange={setPage}
      />
    </div>
  );
}
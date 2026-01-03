"use client";

import { useEffect, useState } from "react";
import StationFilter from "./components/station-filter";
import { useStationActions } from "@/hooks/use-station";
import "@tomtom-international/web-sdk-maps/dist/maps.css";
import StationHeader from "./components/station-header";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { stationColumns } from "@/columns/station-column";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import StationStats from "./components/StationStats";
function StationTableSection({ page, limit, searchQuery, setPage, deleteStation, router }: any) {
  // Hook gọi ở đây mới kích hoạt được Suspense fallback ở cha
  const { stations, paginationStations } = useStationActions({
    page,
    limit,
    name: searchQuery,
  });

  return (
    <div className="w-full rounded-lg space-y-4 flex flex-col">
      <DataTable
        title="Danh sách trạm xe"
        columns={stationColumns({
          onDelete: ({ id }) => deleteStation(id),
          onView: ({ id }) => router.push(`/admin/stations/detail/${id}`),
        })}
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
export default function StationClient() {
  const router = useRouter();
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [stationID, setStationID] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const {
    getStationByID,
  } = useStationActions({
    hasToken: true,
    page: page,
    limit: limit,
    stationId: stationID,
    name: searchQuery,
  });
  useEffect(() => {
    if (stationID) {
      console.log("stationID", stationID);
      getStationByID();
    }
  }, [stationID, getStationByID]);
  const handleAddStation = () => {
    router.push(`/admin/stations/create`);
  }
  return (
    <div className="space-y-6">
      <StationHeader onAddStation={() => handleAddStation()} />
      <StationStats activeStation={100} inActiveStation={100} totalStation={100}/>
      <StationFilter value={searchQuery} onChange={setSearchQuery} />
      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <StationTableSection 
          page={page} 
          limit={10} 
          searchQuery={searchQuery}
          setPage={setPage}
          router={router}
        />
      </Suspense>
    </div>
  );
}

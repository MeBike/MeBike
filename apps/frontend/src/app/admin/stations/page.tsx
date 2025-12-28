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
import StationStats from "./components/StationStats";
export default function StationsPage() {
  const router = useRouter();
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [stationID, setStationID] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const {
    getAllStations,
    stations,
    paginationStations,
    deleteStation,
    getStationByID,
  } = useStationActions({
    hasToken: true,
    page: page,
    limit: limit,
    stationId: stationID,
    name: searchQuery,
  });
  useEffect(() => {
    getAllStations();
  }, [page, searchQuery, getAllStations]);
  useEffect(() => {
    if (stationID) {
      console.log("stationID", stationID);
      getStationByID();
    }
  }, [stationID, getStationByID]);
  const handleViewDetailStation = (stationId: string) => {
    setStationID(stationId);
    router.push(`/admin/stations/detail/${stationId}`);
  };
  return (
    <div className="space-y-6">
      <StationHeader onAddStation={() => {}} />
      <StationStats activeStation={100} inActiveStation={100} totalStation={100}/>
      <StationFilter value={searchQuery} onChange={setSearchQuery} />
      <div className="w-full rounded-lg space-y-4 flex flex-col">
        <div>
          <DataTable
            title="Danh sách trạm xe"
            columns={stationColumns({
              onDelete: ({ id }) => deleteStation(id),
              onView: ({ id }) => {
                handleViewDetailStation(id);
              },
            })}
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
    </div>
  );
}

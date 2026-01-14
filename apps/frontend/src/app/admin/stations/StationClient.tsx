"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import StationHeader from "./components/station-header";
import StationStats from "./components/StationStats";
import StationTableSection from "./components/station-table";
import { useStationActions } from "@/hooks/use-station";
import StationManagementSkeleton from "./loading";
export default function StationClient() {
  const [page, setPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 1000);
  const router = useRouter();
  const handleAddStation = () => {
    router.push(`/admin/stations/create`);
  };
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery]);
  return (
    <div>
      <Suspense fallback={<StationManagementSkeleton />}>
        <StationDashboard
        page={page}
        setPage={setPage}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        debouncedSearchQuery={debouncedSearchQuery}
        handleAddStation={handleAddStation}
        router={router}
      />
      </Suspense>
    </div>
  );
}

function StationDashboard({
  page,
  setPage,
  searchQuery,
  setSearchQuery,
  debouncedSearchQuery,
  handleAddStation,
  router,
}: any) {
  const { inactiveStation, activeStation, totalStation } = useStationActions({
    hasToken: true,
    name: debouncedSearchQuery,
  });
  return (
    <div className="space-y-6">
      <StationHeader onAddStation={handleAddStation} />
      <StationStats
        activeStation={activeStation ?? 0}
        inActiveStation={inactiveStation ?? 0}
        totalStation={totalStation ?? 0}
      />
      <StationTableSection
        debouncedSearchQuery={debouncedSearchQuery}
        page={page}
        limit={10}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setPage={setPage}
        router={router}
      />
    </div>
  );
}

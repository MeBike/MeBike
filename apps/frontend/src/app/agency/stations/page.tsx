"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAgencyActions } from "@/hooks/use-agency";
import { StationTableSection } from "./components/station-table-section";
import { TableSkeleton } from "@/components/table-skeleton";
export default function StationsPage() {
  const router = useRouter();
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(7);
  const [searchQuery, setSearchQuery] = useState("");
  const {
    agencyStation,
    getMyAgencyStation,
    isLoadingMyAgencyStation
  } = useAgencyActions({
    hasToken: true,
    page: page,
    pageSize: limit,
  });
  const [isVisualLoading, setIsVisualLoading] = useState(false);
  useEffect(() => {
    if (isLoadingMyAgencyStation) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingMyAgencyStation]);

  useEffect(() => {
    getMyAgencyStation();
  }, [page, getMyAgencyStation, limit]);
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);
  return (
    <div>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
            Quản lý trạm xe
          </h1>
          <p className="text-muted-foreground text-lg">
            Hệ thống giám sát và vận hành trạm xe đạp thông minh.
          </p>
        </div>
      </div>
      <div className="space-y-4 min-h-[400px]">
        <h2 className="text-2xl font-bold px-1">Danh sách vận hành</h2>
        {isVisualLoading ? (
          <TableSkeleton />
        ) : (
          <StationTableSection
            stations={agencyStation?.data ?? []}
            pagination={agencyStation?.pagination}
            setPage={setPage}
            isLoading={isLoadingMyAgencyStation}
            onView={(id) => {
              router.push(`/agency/stations/detail/${id}`)
            }}
          />
        )}
      </div>
      </div>
    </div>
  );
}

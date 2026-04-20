"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, ChevronUp } from "lucide-react";
import { useStationActions } from "@/hooks/use-station";
import { RevenueReport } from "./components/revenue-report";
import { StationTableSection } from "./components/station-table-section";
import { ReportSkeleton } from "./components/loading-skeleton";
import { TableSkeleton } from "@/components/table-skeleton";
export default function StationsPage() {
  const router = useRouter();
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(7);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRevenueReport, setShowRevenueReport] = useState(false);
  const {
    getMyStation,
    myStation,
    paginationMyStation,
    isLoadingMyStation,
  } = useStationActions({
    hasToken: true,
    page: page,
    limit: limit,
    name: searchQuery,
  });
  const [isVisualLoading, setIsVisualLoading] = useState(false);
  useEffect(() => {
    if (isLoadingMyStation) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingMyStation]);
  useEffect(() => {
    getMyStation();
  }, [page, getMyStation, limit]);
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
            stations={myStation}
            pagination={paginationMyStation}
            setPage={setPage}
            isLoading={isLoadingMyStation}
            onView={(id) => {
              router.push(`/technician/stations/detail/${id}`)
            }}
          />
        )}
      </div>
      </div>
    </div>
  );
}

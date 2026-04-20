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
        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 shadow-sm">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc địa chỉ trạm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          <Button variant="outline" onClick={() => setSearchQuery("")}>
            Đặt lại
          </Button>
        </div>
        {isVisualLoading ? (
          <TableSkeleton />
        ) : (
          <StationTableSection
            stations={myStation}
            pagination={paginationMyStation}
            setPage={setPage}
            isLoading={isLoadingMyStation}
            onView={(id) => {
              router.push(`/staff/stations/detail/${id}`)
            }}
          />
        )}
      </div>
      </div>
    </div>
  );
}

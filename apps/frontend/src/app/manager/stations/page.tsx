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
  const { getMyStation, myStation, paginationMyStation, isLoadingMyStation } =
    useStationActions({
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
      // Khi API xong, đợi thêm một chút rồi mới tắt Skeleton
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600); // 600ms là khoảng "vàng" để UI mượt mà
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Quản lý trạm
              </h1>
              <p className="text-muted-foreground mt-1">
                Theo dõi và quản lý trạm
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-4 min-h-[400px]">
          {isVisualLoading ? (
            <TableSkeleton />
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Hiển thị {paginationMyStation?.page ?? 1} /{" "}
                {paginationMyStation?.totalPages ?? 1} trang
              </p>
              <StationTableSection
                stations={myStation}
                pagination={paginationMyStation}
                setPage={setPage}
                isLoading={isLoadingMyStation}
                onView={(id) => {
                  router.push(`/manager/stations/detail/${id}`);
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

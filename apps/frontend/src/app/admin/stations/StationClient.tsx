"use client";

import { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, ChevronUp } from "lucide-react";
import { RevenueReport } from "./components/revenue-report";
import { StationTableSection } from "./components/station-table-section";
import { ReportSkeleton } from "./components/loading-skeleton";
import { TableSkeleton } from "@/components/table-skeleton";
interface StationClientProps {
  data: {
    stations: any[];
    paginationStations: any;
    responseStationRevenue: any;
    showRevenueReport: boolean;
    isVisualLoading: boolean;
    isLoadingGetAllStations: boolean;
  };
  filters: {
    searchQuery: string;
  };
  actions: {
    setSearchQuery: Dispatch<SetStateAction<string>>;
    setPage: Dispatch<SetStateAction<number>>;
    handleToggleRevenueReport: () => void;
    handleResetSearch: () => void;
    deleteStation: (id: string) => void;
  };
}
export default function StationClient({
  data: {
    stations,
    paginationStations,
    responseStationRevenue,
    showRevenueReport,
    isVisualLoading,
    isLoadingGetAllStations,
  },
  filters: { searchQuery },
  actions: {
    setSearchQuery,
    setPage,
    handleToggleRevenueReport,
    handleResetSearch,
    deleteStation,
  },
}: StationClientProps) {
  const router = useRouter();
  return (
    <div>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 border-b pb-6 md:flex-row md:items-center">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
              Quản lý trạm xe
            </h1>
            <p className="text-lg text-muted-foreground">
              Hệ thống giám sát và vận hành trạm xe đạp thông minh.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="lg"
              variant={showRevenueReport ? "secondary" : "outline"}
              onClick={handleToggleRevenueReport}
              className="rounded-full"
            >
              {showRevenueReport ? (
                <ChevronUp className="mr-2 h-4 w-4" />
              ) : (
                <BarChart3 className="mr-2 h-4 w-4" />
              )}
              {showRevenueReport ? "Ẩn báo cáo" : "Báo cáo doanh thu"}
            </Button>
            <Button
              size="lg"
              onClick={() => router.push("/admin/stations/create")}
              className="rounded-full shadow-md"
            >
              <Plus className="mr-2 h-5 w-5" /> Thêm trạm
            </Button>
          </div>
        </div>

        {showRevenueReport &&
          (!responseStationRevenue ? (
            <ReportSkeleton />
          ) : (
            <div>
              <h2 className="mb-4 text-2xl font-bold">
                Báo cáo doanh thu theo trạm
              </h2>
              <RevenueReport data={responseStationRevenue} /> 
            </div>
          ))}
        <div className="min-h-[400px] space-y-4">
          <h2 className="px-1 text-2xl font-bold">Danh sách vận hành</h2>
          
          <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
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
                className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Button variant="outline" onClick={handleResetSearch}>
              Đặt lại
            </Button>
          </div>

          {isVisualLoading ? (
            <TableSkeleton />
          ) : (
            <StationTableSection
              stations={stations}
              pagination={paginationStations}
              setPage={setPage}
              isLoading={isLoadingGetAllStations}
              onView={(id) => {
                router.push(`/admin/stations/detail/${id}`);
              }}
              onDelete={(id) => {
                if (confirm("Bạn có chắc chắn muốn xóa trạm này?")) {
                  deleteStation(id);
                }
              }}
              onEdit={(id) => {
                router.push(`/admin/stations/${id}`);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
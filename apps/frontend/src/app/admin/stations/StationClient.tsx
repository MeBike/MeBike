"use client";

import { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, ChevronUp } from "lucide-react";
import { RevenueReport } from "./components/revenue-report";
import { StationTableSection } from "./components/station-table-section";
import { ReportSkeleton } from "./components/loading-skeleton";
import { TableSkeleton } from "@/components/table-skeleton";
import { Pagination, Station, StationStatisticsResponse } from "@custom-types";
import type { StationBikeRevenue } from "@custom-types";
interface StationClientProps {
  data: {
    stations: Station[];
    paginationStations?: Pagination;
    responseStationRevenue?: StationBikeRevenue;
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
          {isVisualLoading ? (
            <TableSkeleton />
          ) : (
            <div>
              <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Hiển thị {paginationStations?.page ?? 1} /{" "}
                {paginationStations?.totalPages ?? 1} trang
              </p>
            </div>
            <StationTableSection
              stations={stations}
              pagination={paginationStations}
              setPage={setPage}
              isLoading={isLoadingGetAllStations}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

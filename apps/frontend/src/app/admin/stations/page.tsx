"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, ChevronUp } from "lucide-react";
import { useStationActions } from "@/hooks/use-station";
import { RevenueReport } from "./components/revenue-report";
import { StationTableSection } from "./components/station-table-section";
import { ReportSkeleton, TableSkeleton } from "./components/loading-skeleton";
export default function StationsPage() {
  const router = useRouter();
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(7);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRevenueReport, setShowRevenueReport] = useState(false);
  const {
    getAllStations,
    stations,
    paginationStations,
    deleteStation,
    getStationRevenue,
    responseStationRevenue,
    isLoadingGetAllStations
  } = useStationActions({
    hasToken: true,
    page: page,
    limit: limit,
    name: searchQuery,
  });

  useEffect(() => {
    getAllStations();
  }, [page, searchQuery, getAllStations, limit]);

  return (
    <div className="container mx-auto py-8 px-4 space-y-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Quản lý trạm xe</h1>
          <p className="text-muted-foreground text-lg">Hệ thống giám sát và vận hành trạm xe đạp thông minh.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            size="lg" 
            variant={showRevenueReport ? "secondary" : "outline"}
            onClick={() => {
              if (!showRevenueReport) getStationRevenue();
              setShowRevenueReport(!showRevenueReport);
            }}
            className="rounded-full"
          >
            {showRevenueReport ? <ChevronUp className="w-4 h-4 mr-2" /> : <BarChart3 className="w-4 h-4 mr-2" />}
            {showRevenueReport ? "Ẩn báo cáo" : "Báo cáo doanh thu"}
          </Button>
          <Button size="lg" onClick={() => router.push("/admin/stations/create")} className="rounded-full shadow-md">
            <Plus className="w-5 h-5 mr-2" /> Thêm trạm
          </Button>
        </div>
      </div>

      {showRevenueReport && (
        (!responseStationRevenue) ? (
          <ReportSkeleton />
        ) : (
          <RevenueReport data={responseStationRevenue} />
        )
      )}
      
      <div className="space-y-4">
        <h2 className="text-2xl font-bold px-1">Danh sách vận hành</h2>
        {isLoadingGetAllStations ? (
          <TableSkeleton />
        ) : (
          <StationTableSection
            stations={stations}
            pagination={paginationStations}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setPage={setPage}
            isLoading={isLoadingGetAllStations}
            onDelete={(id) => {
               if(confirm("Bạn có chắc chắn muốn xóa trạm này?")) deleteStation(id);
            }}
            onEdit={(id) => {
              router.push(`/admin/stations/${id}`);
            }}  
          />
        )}
      </div>
    </div>
  );
}
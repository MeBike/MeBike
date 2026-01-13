"use client";

import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Bike, BikeRentalHistory, BikeStatus } from "@custom-types";
import { CloudCog, Plus } from "lucide-react";
import { useBikeActions } from "@/hooks/use-bike";
import { Loader2 } from "lucide-react";
import { bikeColumn } from "@/columns/bike-colums";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { useStationActions } from "@/hooks/use-station";
import { useSupplierActions } from "@/hooks/use-supplier";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import BikeManagementSkeleton from "./loading";
import { useDebounce } from "@/hooks/use-debounce";
export default function BikeClient() {
  const [detailId, setDetailId] = useState<string>("");
  const [editId, setEditId] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit,] = useState<number>(10);
  const [statusFilter, setStatusFilter] = useState<BikeStatus | "all">("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debounceSearch = useDebounce(searchQuery, 500);
  const [newBike, setNewBike] = useState({
    stationid: "",
    supplierid: "",
    chipid: "",
  });
  // const {responseStationBikeRevenue, getStationBikeRevenue} = useStationActions({ hasToken: true });
  const [editBike, setEditBike] = useState<Bike | null>(null);
  const { stations } = useStationActions({ hasToken: true });
  const { allSupplier } = useSupplierActions({ hasToken: true });
  const [detailTab, setDetailTab] = useState<
    "info" | "rentals" | "stats" | "activity"
  >("info");
  const {
    data,
    detailBike,
    // statisticData,
    // isLoadingStatistics,
    paginationBikes,
    createBike,
    updateBike,
    getBikeByID,
    isLoadingDetail,
    // bikeActivityStats,
    // getBikeActivityStats,
    // bikeStats,
    // isFetchingBikeStats,
    // bikeRentals,
    // isFetchingRentalBikes,
    // getRentalBikes,
    // getBikeStats,
    getBikes,
  } = useBikeActions(
    true,
    detailId,
    undefined,
    undefined,
    statusFilter !== "all" ? (statusFilter as BikeStatus) : undefined,
    limit,
    page,
    debounceSearch
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showBikeRevenue, setShowBikeRevenue] = useState(false);
  const [expandedStations, setExpandedStations] = useState<Set<string>>(new Set());

  const toggleStation = (stationId: string) => {
    setExpandedStations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stationId)) {
        newSet.delete(stationId);
      } else {
        newSet.add(stationId);
      }
      return newSet;
    });
  };

  const handleViewDetails = (bikeId: string) => {
    router.push(`/admin/bikes/detail/${bikeId}`);
    setDetailId(bikeId);
    setIsDetailModalOpen(true);
  }
  const handleEditBike = (bikeId: string) => {
    // Set the bike ID to edit and fetch its details
    setEditId(bikeId);
    getBikeByID();
    // The useEffect will open the edit modal when the data is loaded
  };
  useEffect(() => {
    if (!isLoadingDetail && detailBike && editId) {
      setEditBike(detailBike);
      setIsEditModalOpen(true);
    }
  }, [isLoadingDetail, detailBike, editId]);
  const handleUpdateBike = () => {
    if (!editBike) return;
    updateBike(
      {
        station_id: editBike.station.id,
        supplier_id: editBike.supplier.id,
        status: editBike.status,
        chip_id: editBike.chipId,
      },
      detailId
    );
    setIsEditModalOpen(false);
  };
  const handleCreateBike = () => {
    if (!newBike.stationid || !newBike.chipid) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }
    createBike({
      station_id: newBike.stationid,
      supplier_id: newBike.supplierid,
      chip_id: newBike.chipid,
    });
    setIsCreateModalOpen(false);
    setNewBike({
      stationid: "",
      supplierid: "",
      chipid: "",
    });
  };
  // useEffect(() => {
  //   getStatisticsBike();
  // }, [getStatisticsBike]);
  useEffect(() => {
    if (detailId) {
      getBikeByID();
      // getBikeActivityStats();
      // getBikeStats();
      // getRentalBikes();
    }
  }, [detailId, getBikeByID]);

  useEffect(() => {
    if (editId) {
      getBikeByID();
    }
  }, [editId, getBikeByID]);
  useEffect(() => {
  setPage(1);
}, [debounceSearch]);
  // const available = statisticData?.result["CÓ SẴN"] || 0;
  // const renting = statisticData?.result["ĐANG ĐƯỢC THUÊ"] || 0;
  // const broken = statisticData?.result["BỊ HỎNG"] || 0;
  // const reserved = statisticData?.result["ĐÃ ĐẶT TRƯỚC"] || 0;
  // const total = data?.data?.Bikes.pagination?.total || 0;
  // Number(available) + Number(renting) + Number(broken) + Number(reserved);
  // if (isLoadingStatistics) {
  //   return (
  //     <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
  //       <Loader2 className="animate-spin w-16 h-16 text-primary" />
  //     </div>
  //   );
  // } ì
  if (!data?.data?.Bikes) {
    notFound();
  }
  if (isLoadingDetail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
        <Loader2 className="animate-spin w-16 h-16 text-primary" />
      </div>
    );
  }
  return (
    <Suspense fallback={<BikeManagementSkeleton />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Quản lý xe đạp
            </h1>
            <p className="text-muted-foreground mt-1">
              Quản lý danh sách xe đạp băng chân
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm xe mới
            </Button>
            {/* <Button
                variant="outline"
                onClick={() => {
                  if (!showBikeRevenue) {
                    getStationBikeRevenue();
                  }
                  setShowBikeRevenue(!showBikeRevenue);
                }}
              >
                {showBikeRevenue
                  ? "Ẩn báo cáo doanh thu"
                  : "Xem báo cáo doanh thu"}
              </Button> */}
          </div>
        </div>

        {/* {showBikeRevenue && responseStationBikeRevenue?.result && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="bg-gradient-to-br from-card via-card to-muted/20 border border-border rounded-2xl p-8 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-foreground">
                        Báo cáo Doanh thu Xe Đạp
                      </h2>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 ml-[52px]">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="font-medium">Thời gian:</span>
                      {formatDateUTC(
                        responseStationBikeRevenue.result.period.from
                      )}{" "}
                      <span className="text-muted-foreground/60">→</span>
                      {formatDateUTC(
                        responseStationBikeRevenue.result.period.to
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="group relative bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 rounded-xl p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                            <svg
                              className="w-6 h-6 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Trạm
                            </p>
                            <p className="text-2xl font-bold text-foreground group-hover:text-blue-600 transition-colors">
                              {
                                responseStationBikeRevenue.result.summary
                                  .totalStations
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="h-1 w-full bg-gradient-to-r from-blue-500/20 to-transparent rounded-full"></div>
                    </div>
                  </div>

                  <div className="group relative bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border border-green-500/20 rounded-xl p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                            <svg
                              className="w-6 h-6 text-green-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Doanh Thu
                            </p>
                            <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                              {
                                responseStationBikeRevenue.result.summary
                                  .totalRevenueFormatted
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="h-1 w-full bg-gradient-to-r from-green-500/20 to-transparent rounded-full"></div>
                    </div>
                  </div>

                  <div className="group relative bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/20 rounded-xl p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                            <svg
                              className="w-6 h-6 text-purple-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Lượt Thuê
                            </p>
                            <p className="text-2xl font-bold text-foreground group-hover:text-purple-600 transition-colors">
                              {
                                responseStationBikeRevenue.result.summary
                                  .totalRentals
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="h-1 w-full bg-gradient-to-r from-purple-500/20 to-transparent rounded-full"></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-1 w-12 bg-gradient-to-r from-primary to-primary/20 rounded-full"></div>
                    <h3 className="text-xl font-bold text-foreground">
                      Chi tiết theo trạm và xe
                    </h3>
                  </div>
                  <div className="space-y-6">
                    {responseStationBikeRevenue.result.stations.map(
                      (station, stationIndex) => (
                        <div
                          key={station._id}
                          className="bg-gradient-to-br from-card to-muted/5 border border-border rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                          style={{ animationDelay: `${stationIndex * 100}ms` }}
                        >
                          <div
                            className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b border-border cursor-pointer hover:bg-primary/5 transition-colors"
                            onClick={() => toggleStation(station._id)}
                          >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                                  <svg
                                    className="w-7 h-7 text-primary"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                    />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <h4 className="text-lg font-bold text-foreground">
                                      {station.name}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                                        {station.bikes?.length || 0} xe
                                      </span>
                                      <svg
                                        className={`w-4 h-4 text-muted-foreground transform transition-transform duration-200 ${
                                          expandedStations.has(station._id)
                                            ? "rotate-180"
                                            : ""
                                        }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 9l-7 7-7-7"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                    </svg>
                                    {station.address}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <div className="bg-gradient-to-br from-green-500/15 to-green-500/5 rounded-xl px-5 py-3 border border-green-500/20 min-w-[140px]">
                                  <div className="flex items-center gap-2 mb-1">
                                    <svg
                                      className="w-3.5 h-3.5 text-green-600"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    <p className="text-xs font-medium text-muted-foreground uppercase">
                                      Doanh Thu
                                    </p>
                                  </div>
                                  <p className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                    {station.stationTotalRevenueFormatted}
                                  </p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-500/15 to-blue-500/5 rounded-xl px-5 py-3 border border-blue-500/20 min-w-[120px]">
                                  <div className="flex items-center gap-2 mb-1">
                                    <svg
                                      className="w-3.5 h-3.5 text-blue-600"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                      />
                                    </svg>
                                    <p className="text-xs font-medium text-muted-foreground uppercase">
                                      Lượt Thuê
                                    </p>
                                  </div>
                                  <p className="text-xl font-bold text-blue-600">
                                    {station.stationTotalRentals}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {expandedStations.has(station._id) &&
                            station.bikes &&
                            station.bikes.length > 0 && (
                              <div className="p-6 animate-in slide-in-from-top duration-300">
                                <div className="mb-4 flex items-center gap-3 pb-3 border-b border-border">
                                  <svg
                                    className="w-5 h-5 text-primary"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                                    />
                                  </svg>
                                  <p className="text-sm font-semibold text-foreground">
                                    Chi tiết xe đạp
                                  </p>
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                                    {station.bikes.length}
                                  </span>
                                </div>
                                <div className="grid gap-3">
                                  {station.bikes.map((bike, bikeIndex) => (
                                    <div
                                      key={bike._id}
                                      className="group bg-gradient-to-r from-muted/30 to-transparent border border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-md transition-all duration-200"
                                      style={{
                                        animationDelay: `${bikeIndex * 30}ms`,
                                      }}
                                    >
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 flex items-center justify-center group-hover:scale-110 group-hover:border-primary/40 transition-all">
                                            <svg
                                              className="w-6 h-6 text-primary"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <circle
                                                cx="7"
                                                cy="17"
                                                r="3"
                                                strokeWidth={2}
                                              />
                                              <circle
                                                cx="17"
                                                cy="17"
                                                r="3"
                                                strokeWidth={2}
                                              />
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M14 7l-4 10M7 17h10M17 17V7"
                                              />
                                            </svg>
                                          </div>
                                          <div>
                                            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                              {bike.chip_id}
                                            </p>
                                            <p className="text-xs text-muted-foreground font-medium">
                                              Mã Chip
                                            </p>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3 sm:gap-6">
                                          <div className="text-center">
                                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                              <svg
                                                className="w-3.5 h-3.5 text-green-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                              </svg>
                                              <p className="text-xs text-muted-foreground font-medium">
                                                Doanh Thu
                                              </p>
                                            </div>
                                            <p className="text-sm font-bold text-green-600">
                                              {bike.totalRevenueFormatted}
                                            </p>
                                          </div>
                                          <div className="text-center">
                                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                              <svg
                                                className="w-3.5 h-3.5 text-blue-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                                />
                                              </svg>
                                              <p className="text-xs text-muted-foreground font-medium">
                                                Lượt Thuê
                                              </p>
                                            </div>
                                            <p className="text-sm font-bold text-blue-600">
                                              {bike.totalRentals}
                                            </p>
                                          </div>
                                          <div className="text-center">
                                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                              <svg
                                                className="w-3.5 h-3.5 text-purple-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                              </svg>
                                              <p className="text-xs text-muted-foreground font-medium">
                                                Thời Gian
                                              </p>
                                            </div>
                                            <p className="text-sm font-bold text-purple-600">
                                              {Math.round(
                                                bike.totalDuration / 60
                                              )}
                                              h {bike.totalDuration % 60}m
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )} */}

        {/* <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Tổng số xe</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {total || ""}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Có sẵn</p>
              <p className="text-2xl font-bold text-green-500 mt-1">
                {available || ""}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Đang thuê</p>
              <p className="text-2xl font-bold text-blue-500 mt-1">
                {renting || ""}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Bị hỏng</p>
              <p className="text-2xl font-bold text-red-500 mt-1">
                {broken || "0"}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Đã đặt trước</p>
              <p className="text-2xl font-bold text-orange-500 mt-1">
                {reserved || "0"}
              </p>
            </div>
          </div> */}

        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as BikeStatus | "all")
              }
              className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Available">Có sẵn</option>
              <option value="Booked">Đang được thuê</option>
              <option value="Broken">Bị hỏng</option>
              <option value="Reserved">Đã đặt trước</option>
              <option value="Maintenance">Đang bảo trì</option>
              <option value="NotAvailable">Không có sẵn</option>
            </select>
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter("all");
              }}
            >
              Đặt lại
            </Button>
          </div>
        </div>

        <div className="w-full rounded-lg space-y-4  flex flex-col">
          <DataTable
            title="Danh sách xe đạp"
            columns={bikeColumn({
              onView: ({ id }: { id: string }) => {
                handleViewDetails(id);
              },
              onEdit: ({ id }: { id: string }) => {
                handleEditBike(id);
              },
            })}
            data={data?.data?.Bikes?.data || []}
            searchValue={searchQuery}
            filterPlaceholder="Search bike with chip id"
            onSearchChange={setSearchQuery}
          />
          <PaginationDemo
            currentPage={paginationBikes?.page ?? 1}
            onPageChange={setPage}
            totalPages={paginationBikes?.totalPages ?? 1}
          />
        </div>

        <p className="text-sm text-muted-foreground">
          Trang {paginationBikes?.page} / {paginationBikes?.totalPages} xe đạp
        </p>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Thêm xe đạp mới
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Trạm xe
                </label>
                <select
                  value={newBike.stationid}
                  onChange={(e) =>
                    setNewBike({ ...newBike, stationid: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                >
                  <option value="">Chọn trạm xe</option>
                  {stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Nhà cung cấp
                </label>
                <select
                  value={newBike.supplierid}
                  onChange={(e) =>
                    setNewBike({ ...newBike, supplierid: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                >
                  <option value="">Chọn nhà cung cấp</option>
                  {allSupplier?.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">
                  Chip ID
                </label>
                <input
                  type="text"
                  value={newBike.chipid}
                  onChange={(e) =>
                    setNewBike({ ...newBike, chipid: e.target.value })
                  }
                  placeholder="Nhập Chip ID"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button onClick={handleCreateBike} className="flex-1">
                Thêm xe đạp
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* {isDetailModalOpen && detailBike && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Chi tiết xe đạp
              </h2>
              <div className="flex gap-2 mb-6 border-b border-border">
                <button
                  onClick={() => setDetailTab("info")}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    detailTab === "info"
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Thông tin
                </button>
                <button
                  onClick={() => setDetailTab("rentals")}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    detailTab === "rentals"
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Lịch sử thuê
                </button>
                <button
                  onClick={() => setDetailTab("stats")}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    detailTab === "stats"
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Thống kê
                </button>
                <button
                  onClick={() => setDetailTab("activity")}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    detailTab === "activity"
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Hoạt động
                </button>
              </div>

              {detailTab === "info" && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">ID Xe</p>
                    <p className="text-foreground font-medium">
                      {detailBike.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Chip ID</p>
                    <p className="text-foreground font-medium">
                      {detailBike.chipId}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Trạm</p>
                    <p className="text-foreground font-medium">
                      {detailBike.station.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Nhà cung cấp
                    </p>
                    <p className="text-foreground font-medium">
                      {detailBike.supplier.name || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Trạng thái</p>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        detailBike.status
                      )}`}
                    >
                      {detailBike.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ngày tạo</p>
                    <p className="text-foreground font-medium">
                      {formatToVNTime(detailBike.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Ngày cập nhật
                    </p>
                    <p className="text-foreground font-medium">
                      {formatToVNTime(detailBike.updatedAt)}
                    </p>
                  </div>
                </div>
              )}

              {detailTab === "rentals" && (
                <div className="space-y-3">
                  {isFetchingRentalBikes ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="animate-spin w-6 h-6 text-primary" />
                      <span className="ml-2 text-sm text-muted-foreground">
                        Đang tải dữ liệu...
                      </span>
                    </div>
                  ) : Array.isArray(bikeRentals) && bikeRentals.length > 0 ? (
                    <div className="bg-muted rounded-lg p-4">
                      <div className="space-y-2">
                        {bikeRentals.map(
                          (rental: BikeRentalHistory, index: number) => (
                            <div
                              key={rental._id}
                              className="flex justify-between items-center py-2 border-b border-border last:border-b-0"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-foreground font-medium">
                                    Đơn thuê #
                                    {(index + 1).toString().padStart(3, "0")}
                                  </span>
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {rental.user.fullname ||
                                      "Người dùng ẩn danh"}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Từ {rental.start_station.name} →{" "}
                                  {rental.end_station.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatDateUTC(rental.start_time)} -{" "}
                                  {formatDateUTC(rental.end_time)}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-foreground">
                                  {parseFloat(
                                    rental.total_price.$numberDecimal
                                  ).toLocaleString()}{" "}
                                  VND
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {Math.round(rental.duration / 60)} phút
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Không có lịch sử thuê
                      </p>
                    </div>
                  )}
                </div>
              )}

              {detailTab === "stats" && (
                <div className="space-y-3">
                  <div className="bg-muted rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-primary/10 border border-primary rounded p-3">
                        <p className="text-xs text-primary">ID xe</p>
                        <p className="text-2xl font-bold text-primary">
                          {bikeActivityStats?.bike_id.slice(0, 8)}
                        </p>
                      </div>
                      {bikeActivityStats?.monthly_stats?.map((stat, idx) => (
                        <div
                          key={idx}
                          className="bg-yellow-100 border border-yellow-300 rounded p-3 mb-2"
                        >
                          <p className="text-xs text-yellow-600">
                            Doanh thu tháng {stat.month}/{stat.year}
                          </p>
                          <p className="text-2xl font-bold text-yellow-800">
                            {stat.revenue.toLocaleString()} VND
                          </p>
                          <p className="text-xs text-yellow-600">
                            Số lượt thuê: {stat.rentals_count}
                          </p>
                          <p className="text-xs text-yellow-600">
                            Phút hoạt động: {stat.minutes_active}
                          </p>
                        </div>
                      ))}
                      <div className="bg-blue-100 border border-blue-300 rounded p-3">
                        <p className="text-xs text-blue-600">
                          Thời gian sử dụng
                        </p>
                        <p className="text-2xl font-bold text-blue-800">
                          {bikeActivityStats?.total_minutes_active || 0} phút
                        </p>
                      </div>
                      <div className="bg-green-100 border border-green-300 rounded p-3">
                        <p className="text-xs text-green-600">
                          Phần trăm thời gian hoạt động
                        </p>
                        <p className="text-2xl font-bold text-green-800">
                          {bikeActivityStats?.uptime_percentage}%
                        </p>
                      </div>
                      <div className="bg-red-100 border border-red-300 rounded p-3">
                        <p className="text-xs text-red-600">
                          Số lượng báo hỏng
                        </p>
                        <p className="text-2xl font-bold text-red-800">
                          {bikeActivityStats?.total_reports || 0} báo hỏng
                        </p>
                      </div>
                      <div className="bg-gray-100 border border-gray-300 rounded p-3">
                        <p className="text-xs text-gray-600">
                          Đánh giá trung bình
                        </p>
                        <p className="text-2xl font-bold text-gray-800">
                          {detailBike.average_rating &&
                          detailBike.average_rating > 0
                            ? `${detailBike.average_rating.toFixed(1)} ⭐ (${detailBike.total_ratings || 0} đánh giá)`
                            : "Chưa có đánh giá"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {detailTab === "activity" && (
                <div className="space-y-3">
                  {isFetchingBikeStats ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="animate-spin w-6 h-6 text-primary" />
                      <span className="ml-2 text-sm text-muted-foreground">
                        Đang tải dữ liệu...
                      </span>
                    </div>
                  ) : bikeActivityStats ? (
                    <div className="bg-muted rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-sm text-foreground">
                            Tổng thời gian hoạt động
                          </span>
                          <span className="text-sm font-medium">
                            {bikeStats?.total_duration_minutes} phút
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-sm text-foreground">
                            Tổng lượt thuê
                          </span>
                          <span className="text-sm font-medium">
                            {bikeStats?.total_rentals}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-sm text-foreground">
                            Tổng lợi nhuận
                          </span>
                          <span className="text-sm font-medium">
                            {bikeStats?.total_revenue?.toLocaleString()} VND
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-sm text-foreground">
                            Tổng báo cáo
                          </span>
                          <span className="text-sm font-medium">
                            {bikeStats?.total_reports}
                          </span>
                        </div>
                        {bikeActivityStats.monthly_stats.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-foreground mb-2">
                              Thống kê theo tháng
                            </p>
                            <div className="space-y-1">
                              {bikeActivityStats.monthly_stats
                                .slice(0, 3)
                                .map((stat, index) => (
                                  <div
                                    key={index}
                                    className="flex justify-between items-center py-1 text-xs"
                                  >
                                    <span className="text-muted-foreground">
                                      {stat.month}/{stat.year}
                                    </span>
                                    <span className="text-foreground">
                                      {stat.rentals_count} lượt -{" "}
                                      {Math.round(stat.minutes_active / 60)}h
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Không có dữ liệu hoạt động
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <div className="w-full">
                  <Button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="w-full mt-6"
                  >
                    Đóng
                  </Button>
                </div>
                <div className="w-full">
                  <Button
                  onClick={() => {
                    setIsEditModalOpen(true);
                    setEditBike(detailBike);
                  }}
                  className="w-full mt-6"
                >
                  Cập nhật
                </Button>
                </div>
              </div>
            </div>
          </div>
        )} */}
      {isEditModalOpen && editBike && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Chỉnh sửa xe đạp
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Trạm xe
                </label>
                <select
                  value={editBike?.station.id || ""}
                  onChange={(e) =>
                    setEditBike(
                      editBike
                        ? {
                          ...editBike,
                          station: {
                            ...editBike.station,
                            id: e.target.value,
                          },
                        }
                        : null
                    )
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                >
                  {stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">
                  Nhà cung cấp
                </label>
                <select
                  value={editBike?.supplier.id || ""}
                  onChange={(e) =>
                    setEditBike(
                      editBike
                        ? {
                          ...editBike,
                          supplier: {
                            ...editBike.supplier,
                            id: e.target.value,
                          },
                        }
                        : null
                    )
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                >
                  {allSupplier?.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">
                  Chip ID
                </label>
                <input
                  type="text"
                  value={editBike?.chipId || ""}
                  onChange={(e) =>
                    setEditBike(
                      editBike
                        ? { ...editBike, chipId: e.target.value }
                        : null
                    )
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button onClick={handleUpdateBike} className="flex-1">
                Cập nhật
              </Button>
            </div>
          </div>
        </div>
      )}
    </Suspense>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useStationActions } from "@/hooks/use-station";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stationSchema, StationSchemaFormData } from "@/schemas/stationSchema";
import { Input } from "@/components/ui/input";
import "@tomtom-international/web-sdk-maps/dist/maps.css";
import * as tt from "@tomtom-international/web-sdk-maps";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { stationColumns } from "@/columns/station-column";
import { formatDateUTC } from "@/utils/formatDateTime";
import type { StationStatistic } from "@/types/Station";

export default function StationsPage() {
  // STATES
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<tt.Map | null>(null);
  const editMapRef = useRef<HTMLDivElement>(null);
  const editMapInstanceRef = useRef<tt.Map | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [stationID, setStationID] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const {
    getAllStations,
    stations,
    paginationStations,
    createStation,
    deleteStation,
    getStationByID,
    responseStationDetail,
    isLoadingGetStationByID,
    updateStation,
    getReservationStats,
    responseStationReservationStats,
    getStationRevenue,
    responseStationRevenue
  } = useStationActions({
    hasToken: true,
    page: page,
    limit: limit,
    stationId: stationID,
    name: searchQuery,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showRevenueReport, setShowRevenueReport] = useState(false);
  const {
    register: createRegister,
    handleSubmit: handleCreateSubmit,
    setValue: setCreateValue,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm<StationSchemaFormData>({
    resolver: zodResolver(stationSchema),
    defaultValues: {
      name: "",
      address: "",
      latitude: "",
      longitude: "",
      capacity: "",
    },
  });
  const {
    register: editRegister,
    handleSubmit: handleEditSubmit,
    setValue: setEditValue,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<StationSchemaFormData>({
    resolver: zodResolver(stationSchema),
    defaultValues: {
      name: "",
      address: "",
      latitude: "",
      longitude: "",
      capacity: "",
    },
  });

  useEffect(() => {
    getAllStations();
  }, [page, searchQuery, getAllStations]);

  useEffect(() => {
    if (stationID) {
      getStationByID();
      getReservationStats();
    }
  }, [stationID, getStationByID, getReservationStats]);

  useEffect(() => {
    if (isEditModalOpen && responseStationDetail) {
      resetEdit({
        name: responseStationDetail.name,
        address: responseStationDetail.address,
        latitude: responseStationDetail.latitude,
        longitude: responseStationDetail.longitude,
        capacity: responseStationDetail.capacity,
      });
    }
  }, [isEditModalOpen, responseStationDetail, resetEdit]);

  useEffect(() => {
    getStationRevenue();
  }, [getStationRevenue]);

  // MAP FOR CREATE MODAL
  useEffect(() => {
    if (!isModalOpen || !mapRef.current || mapInstanceRef.current) return;

    const timer = setTimeout(() => {
      const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
      if (!apiKey) return;

      mapInstanceRef.current = tt.map({
        key: apiKey,
        container: mapRef.current as HTMLElement,
        center: [106.70098, 10.77689],
        zoom: 14,
        style: "https://api.tomtom.com/style/1/style/20.3.2-*?map=hybrid_main",
      });

      setTimeout(() => {
        mapInstanceRef.current?.resize();
      }, 300);

      const markerRef = { current: null as tt.Marker | null };

      mapInstanceRef.current.on("click", function (e) {
        const { lat, lng } = e.lngLat;
        setCreateValue("latitude", lat.toString());
        setCreateValue("longitude", lng.toString());

        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
        } else {
          markerRef.current = new tt.Marker({ draggable: false })
            .setLngLat([lng, lat])
            .addTo(mapInstanceRef.current!);
        }
      });
    }, 400);

    return () => {
      clearTimeout(timer);
      if (!isModalOpen && mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isModalOpen, setCreateValue]);

  // MAP FOR EDIT MODAL
  useEffect(() => {
    if (!isEditModalOpen || !editMapRef.current || editMapInstanceRef.current || !responseStationDetail?.latitude || !responseStationDetail?.longitude) return;

    const timer = setTimeout(() => {
      const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
      if (!apiKey) return;

      const lat = parseFloat(responseStationDetail.latitude);
      const lng = parseFloat(responseStationDetail.longitude);

      editMapInstanceRef.current = tt.map({
        key: apiKey,
        container: editMapRef.current as HTMLElement,
        center: [lng, lat],
        zoom: 14,
        style: "https://api.tomtom.com/style/1/style/20.3.2-*?map=basic_main",
      });

      setTimeout(() => {
        editMapInstanceRef.current?.resize();
      }, 300);

      const editMarkerRef = { current: null as tt.Marker | null };

      // Add initial marker at existing location
      editMarkerRef.current = new tt.Marker({ draggable: false })
        .setLngLat([lng, lat])
        .addTo(editMapInstanceRef.current!);

      // Update position on click
      editMapInstanceRef.current.on("click", function (e) {
        const { lat, lng } = e.lngLat;
        setEditValue("latitude", lat.toString());
        setEditValue("longitude", lng.toString());

        if (editMarkerRef.current) {
          editMarkerRef.current.setLngLat([lng, lat]);
        } else {
          editMarkerRef.current = new tt.Marker({ draggable: false })
            .setLngLat([lng, lat])
            .addTo(editMapInstanceRef.current!);
        }
      });
    }, 400);

    return () => {
      clearTimeout(timer);
      if (!isEditModalOpen && editMapInstanceRef.current) {
        editMapInstanceRef.current.remove();
        editMapInstanceRef.current = null;
      }
    };
  }, [isEditModalOpen, responseStationDetail, setEditValue]);

  // ADD STATION
  const handleAddStation = (data: StationSchemaFormData) => {
    createStation(data);
    resetCreate();
    setIsModalOpen(false);
  };

  // EDIT STATION
  const handleEditStation = (data: StationSchemaFormData) => {
    updateStation(data);
    setIsEditModalOpen(false);
  };

  // UI
  return (
    <div>
      {/* HEADER */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Quản lý trạm xe
            </h1>
            <p className="text-muted-foreground mt-1">
              Quản lý danh sách trạm xe đạp
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Thêm trạm mới
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (!showRevenueReport) {
                  getStationRevenue();
                }
                setShowRevenueReport(!showRevenueReport);
              }}
            >
              {showRevenueReport
                ? "Ẩn báo cáo doanh thu"
                : "Xem báo cáo doanh thu"}
            </Button>
          </div>
        </div>

        {/* <div className="grid gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Tổng số trạm</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {allStation}
            </p>
          </div>
        </div> */}

        {showRevenueReport && responseStationRevenue?.result && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-gradient-to-br from-card via-card to-muted/20 border border-border rounded-2xl p-8 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">
                      Báo cáo Doanh thu Trạm Xe
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 ml-[52px]">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="font-medium">Thời gian:</span>
                    {formatDateUTC(responseStationRevenue.result.period.from)}{" "}
                    <span className="text-muted-foreground/60">→</span>
                    {formatDateUTC(responseStationRevenue.result.period.to)}
                  </p>
                </div>
              </div>

              {/* SUMMARY CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="group relative bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 rounded-xl p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trạm</p>
                          <p className="text-2xl font-bold text-foreground group-hover:text-blue-600 transition-colors">
                            {responseStationRevenue.result.summary.totalStations}
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
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Doanh Thu</p>
                          <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            {responseStationRevenue.result.summary.totalRevenueFormatted}
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
                          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lượt Thuê</p>
                          <p className="text-2xl font-bold text-foreground group-hover:text-purple-600 transition-colors">
                            {responseStationRevenue.result.summary.totalRentals}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="h-1 w-full bg-gradient-to-r from-purple-500/20 to-transparent rounded-full"></div>
                  </div>
                </div>
                
                <div className="group relative bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent border border-orange-500/20 rounded-xl p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trung Bình</p>
                          <p className="text-2xl font-bold text-foreground group-hover:text-orange-600 transition-colors">
                            {responseStationRevenue.result.summary.avgRevenuePerStationFormatted}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="h-1 w-full bg-gradient-to-r from-orange-500/20 to-transparent rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* STATIONS TABLE */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-1 w-12 bg-gradient-to-r from-primary to-primary/20 rounded-full"></div>
                  <h3 className="text-xl font-bold text-foreground">
                    Chi tiết theo trạm
                  </h3>
                </div>
                <div className="space-y-4">
                  {responseStationRevenue.result.stations.map(
                    (station: StationStatistic, index: number) => (
                      <div 
                        key={station._id} 
                        className="group bg-gradient-to-r from-card to-muted/5 border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/50 transition-all duration-300"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                          {/* Station Info */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {station.name}
                                </h4>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  {station.address}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                            {/* Revenue */}
                            <div className="bg-gradient-to-br from-green-500/10 to-transparent rounded-lg p-4 border border-green-500/20">
                              <div className="flex items-center gap-2 mb-1">
                                <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-xs text-muted-foreground font-medium uppercase">Doanh Thu</p>
                              </div>
                              <p className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                {station.totalRevenueFormatted}
                              </p>
                            </div>

                            {/* Rentals */}
                            <div className="bg-gradient-to-br from-blue-500/10 to-transparent rounded-lg p-4 border border-blue-500/20">
                              <div className="flex items-center gap-2 mb-1">
                                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                <p className="text-xs text-muted-foreground font-medium uppercase">Lượt Thuê</p>
                              </div>
                              <p className="text-xl font-bold text-blue-600">
                                {station.totalRentals}
                              </p>
                            </div>

                            {/* Duration */}
                            <div className="bg-gradient-to-br from-purple-500/10 to-transparent rounded-lg p-4 border border-purple-500/20 col-span-2 lg:col-span-1">
                              <div className="flex items-center gap-2 mb-1">
                                <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-xs text-muted-foreground font-medium uppercase">Thời Gian</p>
                              </div>
                              <p className="text-sm font-semibold text-purple-600">
                                Tổng: {station.totalDurationFormatted}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Trung Bình: {station.avgDurationFormatted}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FILTERS */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc địa chỉ trạm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground"
            />
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Đặt lại
            </Button>
          </div>
        </div>

        {/* TABLE & PAGINATION */}
        <div className="w-full rounded-lg space-y-4 flex flex-col">
          <div>
            <DataTable
              title="Danh sách trạm xe"
              columns={stationColumns({
                onDelete: ({ id }) => deleteStation(id),
                onEdit: ({ id }) => {
                  setStationID(id);
                  setIsEditModalOpen(true);
                },
                onView: ({ id }) => {
                  setStationID(id);
                  setIsDetailModalOpen(true);
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
        <p className="text-sm text-muted-foreground">
          Hiển thị {paginationStations?.total} /{" "}
          {paginationStations?.total} trạm
        </p>
      </div>

      {/* ADD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">
                Thêm trạm mới
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <form
              className="space-y-4"
              onSubmit={handleCreateSubmit(handleAddStation)}
            >
              <label className="block text-sm font-medium text-foreground mb-1">
                Tên trạm
              </label>
              <Input
                type="text"
                {...createRegister("name")}
                placeholder="Nhập tên trạm"
              />
              {createErrors.name && (
                <p className="text-sm text-red-500 mt-1">
                  {createErrors.name.message}
                </p>
              )}
              <label className="block text-sm font-medium text-foreground mb-1">
                Địa chỉ
              </label>
              <Input
                type="text"
                {...createRegister("address")}
                placeholder="Nhập địa chỉ trạm"
              />
              <label className="block text-sm font-medium text-foreground mb-1">
                Chọn vị trí trên bản đồ
              </label>
              <div
                ref={mapRef}
                id="map"
                style={{
                  width: "100%",
                  height: "300px",
                  backgroundColor: "#e5e7eb",
                }}
              ></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Latitude
                  </label>
                  <Input type="text" {...createRegister("latitude")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Longitude
                  </label>
                  <Input type="text" {...createRegister("longitude")} />
                </div>
              </div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Sức chứa (số xe)
              </label>
              <Input
                type="text"
                {...createRegister("capacity")}
                placeholder="Nhập sức chứa"
              />
              {createErrors.capacity && (
                <p className="text-sm text-red-500 mt-1">
                  {createErrors.capacity.message}
                </p>
              )}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button type="submit" className="flex-1">
                  Thêm trạm
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && stationID && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          {isLoadingGetStationByID ? (
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-4"></div>
              <span className="text-lg text-foreground">
                Đang tải dữ liệu...
              </span>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">
                  Chỉnh sửa trạm
                </h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <form
                className="space-y-4"
                onSubmit={handleEditSubmit(handleEditStation)}
              >
                <label className="block text-sm font-medium text-foreground mb-1">
                  Tên trạm
                </label>
                <Input
                  type="text"
                  {...editRegister("name")}
                  placeholder="Nhập tên trạm"
                />
                {editErrors.name && (
                  <p className="text-sm text-red-500 mt-1">
                    {editErrors.name.message}
                  </p>
                )}
                <label className="block text-sm font-medium text-foreground mb-1">
                  Địa chỉ
                </label>
                <Input
                  type="text"
                  {...editRegister("address")}
                  placeholder="Nhập địa chỉ trạm"
                />
                <label className="block text-sm font-medium text-foreground mb-1">
                  Chọn vị trí trên bản đồ
                </label>
                <div
                  ref={editMapRef}
                  id="edit-map"
                  style={{
                    width: "100%",
                    height: "300px",
                    backgroundColor: "#e5e7eb",
                  }}
                ></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Latitude
                    </label>
                    <Input type="text" {...editRegister("latitude")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Longitude
                    </label>
                    <Input type="text" {...editRegister("longitude")} />
                  </div>
                </div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Sức chứa (số xe)
                </label>
                <Input
                  type="text"
                  {...editRegister("capacity")}
                  placeholder="Nhập sức chứa"
                />
                {editErrors.capacity && (
                  <p className="text-sm text-red-500 mt-1">
                    {editErrors.capacity.message}
                  </p>
                )}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button type="submit" className="flex-1">
                    Lưu thay đổi
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {isDetailModalOpen && stationID && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          {isLoadingGetStationByID ? (
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-4"></div>
              <span className="text-lg text-foreground">
                Đang tải dữ liệu...
              </span>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">
                  Chi tiết trạm xe
                </h2>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-1 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Tên trạm
                  </label>
                  <p className="text-foreground font-medium">
                    {responseStationDetail?.name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Địa chỉ
                  </label>
                  <p className="text-foreground">
                    {responseStationDetail?.address}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Latitude
                    </label>
                    <p className="text-foreground">
                      {responseStationDetail?.latitude}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Longitude
                    </label>
                    <p className="text-foreground">
                      {responseStationDetail?.longitude}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Sức chứa
                  </label>
                  <p className="text-foreground">
                    {responseStationDetail?.capacity} xe
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Ngày tạo
                    </label>
                    <p className="text-foreground text-sm">
                      {new Date(
                        responseStationDetail?.created_at || ""
                      ).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Cập nhật lần cuối
                    </label>
                    <p className="text-foreground text-sm">
                      {new Date(
                        responseStationDetail?.updated_at || ""
                      ).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>

                {/* Reservation Stats */}
                {responseStationReservationStats?.result && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-lg font-semibold text-foreground">
                      Thống kê đặt chỗ
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                          Tổng đặt chỗ
                        </label>
                        <p className="text-foreground font-medium">
                          {responseStationReservationStats.result.total_count ||
                            "0"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                          Đang chờ xử lý
                        </label>
                        <p className="text-foreground font-medium">
                          {responseStationReservationStats.result.status_counts
                            .Pending || "0"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                          Đã hủy
                        </label>
                        <p className="text-foreground font-medium">
                          {responseStationReservationStats.result.status_counts
                            .Cancelled || "0"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                          Đã hết hạn
                        </label>
                        <p className="text-foreground font-medium">
                          {responseStationReservationStats.result.status_counts
                            .Expired || "0"}
                        </p>
                      </div>
                      {/* <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                          Đã hết hạn
                        </label>
                        <p className="text-foreground font-medium">
                          {responseStationReservationStats.result.status_counts["ĐÃ HẾT HẠN"]}
                        </p>
                      </div> */}
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                          Xe đang đặt trước
                        </label>
                        <p className="text-foreground font-medium">
                          {
                            responseStationReservationStats.result
                              .reserving_bikes.length
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rating Stats */}
                {(responseStationDetail?.average_rating !== undefined ||
                  responseStationDetail?.total_ratings !== undefined) && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-lg font-semibold text-foreground">
                      Đánh giá trạm
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-6 h-6 ${
                              star <= (responseStationDetail?.average_rating || 0)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="text-xl font-bold text-foreground ml-2">
                          {responseStationDetail?.total_ratings && responseStationDetail.total_ratings > 0
                            ? (responseStationDetail.average_rating || 0).toFixed(1)
                            : "0"}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ({responseStationDetail?.total_ratings || 0} đánh giá)
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <Button
                    type="button"
                    onClick={() => setIsDetailModalOpen(false)}
                    className="w-full"
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

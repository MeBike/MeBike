"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Bike, BikeRentalHistory, BikeStatus } from "@custom-types";
import { Plus } from "lucide-react";
import { useBikeActions } from "@/hooks/useBikeAction";
import { Loader2 } from "lucide-react";
import { bikeColumn } from "@/columns/bike-colums";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { useStationActions } from "@/hooks/useStationAction";
import { useSupplierActions } from "@/hooks/useSupplierAction";
import { getStatusColor } from "@utils/bike-status";

export default function BikesPage() {
  const [detailId, setDetailId] = useState<string>("");
  const [editId, setEditId] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit,] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BikeStatus | "all">("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newBike, setNewBike] = useState({
    station_id: "",
    supplier_id: "",
    chip_id: "",
    status: "CÓ SẴN" as BikeStatus,
  });
  const [editBike, setEditBike] = useState<Bike | null>(null);
  const { stations } = useStationActions({ hasToken: true });
  const { allSupplier } = useSupplierActions(true);
  const [detailTab, setDetailTab] = useState<
    "info" | "rentals" | "stats" | "activity"
  >("info");
  const {
    data,
    detailBike,
    getStatisticsBike,
    statisticData,
    isLoadingStatistics,
    paginationOfBikes,
    paginationBikes,
    createBike,
    updateBike,
    getBikeByID,
    isLoadingDetail,
    bikeActivityStats,
    getBikeActivityStats,
    bikeStats,
    isFetchingBikeStats,
    bikeRentals,
    isFetchingRentalBikes,
    getRentalBikes,
    getBikeStats,
    
  } = useBikeActions(
    true,
    detailId,
    undefined,
    undefined,
    statusFilter !== "all" ? (statusFilter as BikeStatus) : undefined,
    limit,
    page
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const handleViewDetails = (bikeId: string) => {
    setDetailId(bikeId);
    setIsDetailModalOpen(true);
  }
  const handleEditBike = (bikeId: string) => {
    if (editId === bikeId) {
      getBikeByID();
      setIsEditModalOpen(true); 
    } else {
      setEditId(bikeId);
    }
  }
  useEffect(() => {
    if (!isLoadingDetail && detailBike && editId) {
      setEditBike(detailBike);
      setIsEditModalOpen(true);
    }
  }, [isLoadingDetail, detailBike, editId]);
  const handleUpdateBike = () => {
    if (!editBike) return;
    updateBike({
      station_id: editBike.station_id,
      supplier_id: editBike.supplier_id || "",
      status: editBike.status,
      chip_id: editBike.chip_id,
    }, editBike._id);
    setIsEditModalOpen(false);
  };
  const handleCreateBike = () => {
    if (!newBike.station_id || !newBike.chip_id) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }
    createBike({
      station_id: newBike.station_id,
      supplier_id: newBike.supplier_id,
      status: newBike.status,
      chip_id: newBike.chip_id,
    });
    setIsCreateModalOpen(false);
    setNewBike({
      station_id: "",
      supplier_id: "",
      chip_id: "",
      status: "CÓ SẴN",
    });
  };
  useEffect(() => {
    getStatisticsBike();
  }, [getStatisticsBike]);
  useEffect(() => {
    if (detailId) {
      getBikeByID();
      getBikeActivityStats();
      getBikeStats();
      getRentalBikes();
    }
  } , [detailId , getBikeByID, getBikeActivityStats, getBikeStats, getRentalBikes]);

  useEffect(() => {
    if (editId) {
      getBikeByID();
    }
  }, [editId , getBikeByID]);
  if (isLoadingStatistics) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
        <Loader2 className="animate-spin w-16 h-16 text-primary" />
      </div>
    );
  } 
  if (isLoadingDetail){
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
        <Loader2 className="animate-spin w-16 h-16 text-primary" />
      </div>
    );
  }
    return (
      <div>
        <div className="space-y-6">
          {/* Header */}
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
              {/* <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Xuất Excel
            </Button> */}
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Thêm xe mới
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Tổng số xe</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {paginationOfBikes?.totalRecords || ""}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Có sẵn</p>
              <p className="text-2xl font-bold text-green-500 mt-1">
                {statisticData?.result["CÓ SẴN"] || ""}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Đang thuê</p>
              <p className="text-2xl font-bold text-blue-500 mt-1">
                {statisticData?.result["ĐANG ĐƯỢC THUÊ"] || ""}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Bị hỏng</p>
              <p className="text-2xl font-bold text-red-500 mt-1">
                {statisticData?.result["BỊ HỎNG"] || "0"}
              </p>
            </div>
            {/* <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Bảo trì</p>
            <p className="text-2xl font-bold text-orange-500 mt-1">
              {stats.maintenance}
            </p>
          </div> */}
          </div>

          {/* Filters */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Tìm kiếm theo ID xe hoặc Chip ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground"
              />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as BikeStatus | "all")
                }
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="CÓ SẴN">Có sẵn</option>
                <option value="ĐANG ĐƯỢC THUÊ">Đang được thuê</option>
                <option value="BỊ HỎNG">Bị hỏng</option>
                <option value="ĐÃ ĐẶT TRƯỚC">Đã đặt trước</option>
                <option value="ĐANG BẢO TRÌ">Đang bảo trì</option>
                <option value="KHÔNG CÓ SẴN">Không có sẵn</option>
              </select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
              >
                Đặt lại
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="w-full rounded-lg space-y-4  flex flex-col">
            <DataTable
              columns={bikeColumn({
                onView: ({ id }: { id: string }) => {
                  handleViewDetails(id);
                },
                onEdit: ({ id }: { id: string }) => {
                  handleEditBike(id);
                },
                stations: stations,
                suppliers: allSupplier?.data || [],
              })}
              data={data?.data || []}
            />
            <PaginationDemo
              currentPage={paginationBikes?.currentPage ?? 1}
              onPageChange={setPage}
              totalPages={paginationBikes?.totalPages ?? 1}
            />
          </div>

          <p className="text-sm text-muted-foreground">
            Trang {paginationBikes?.currentPage} / {paginationBikes?.totalPages}{" "}
            xe đạp
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
                    value={newBike.station_id}
                    onChange={(e) =>
                      setNewBike({ ...newBike, station_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                  >
                    <option value="">Chọn trạm xe</option>
                    {stations.map((station) => (
                      <option key={station._id} value={station._id}>
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
                    value={newBike.supplier_id}
                    onChange={(e) =>
                      setNewBike({ ...newBike, supplier_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                  >
                    <option value="">Chọn nhà cung cấp</option>
                    {allSupplier?.data.map((supplier) => (
                      <option key={supplier._id} value={supplier._id}>
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
                    value={newBike.chip_id}
                    onChange={(e) =>
                      setNewBike({ ...newBike, chip_id: e.target.value })
                    }
                    placeholder="Nhập Chip ID"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">
                    Trạng thái
                  </label>
                  <select
                    value={newBike.status}
                    onChange={(e) =>
                      setNewBike({
                        ...newBike,
                        status: e.target.value as BikeStatus,
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                  >
                    <option value="CÓ SẴN">Có sẵn</option>
                    <option value="ĐANG ĐƯỢC THUÊ">Đang được thuê</option>
                    <option value="BỊ HỎNG">Bị hỏng</option>
                    <option value="ĐANG BẢO TRÌ">Đang bảo trì</option>
                    <option value="KHÔNG CÓ SẴN">Không có sẵn</option>
                  </select>
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
        {isDetailModalOpen && detailBike && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Chi tiết xe đạp
              </h2>
              {/* Tabs for different sections */}
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
                      {detailBike._id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Chip ID</p>
                    <p className="text-foreground font-medium">
                      {detailBike.chip_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Trạm</p>
                    <p className="text-foreground font-medium">
                      {detailBike.station_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Nhà cung cấp
                    </p>
                    <p className="text-foreground font-medium">
                      {detailBike.supplier_id || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Trạng thái</p>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(detailBike.status)}`}
                    >
                      {detailBike.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ngày tạo</p>
                    <p className="text-foreground font-medium">
                      {new Date(detailBike.created_at).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Ngày cập nhật
                    </p>
                    <p className="text-foreground font-medium">
                      {new Date(detailBike.updated_at).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
              )}

              {detailTab === "rentals" && (
                <div className="space-y-3">
                  {isFetchingRentalBikes ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="animate-spin w-6 h-6 text-primary" />
                      <span className="ml-2 text-sm text-muted-foreground">Đang tải dữ liệu...</span>
                    </div>
                  ) : Array.isArray(bikeRentals) && bikeRentals.length > 0 ? (
                    <div className="bg-muted rounded-lg p-4">
                      {/* <p className="text-sm text-muted-foreground mb-2">
                        API: /bikes/{detailBike._id}/rental-history
                      </p> */}
                      <div className="space-y-2">
                        {bikeRentals.map((rental: BikeRentalHistory, index: number) => (
                          <div key={rental._id} className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-foreground font-medium">
                                  Đơn thuê #{(index + 1).toString().padStart(3, '0')}
                                </span>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {rental.user.fullname || "Người dùng ẩn danh"}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Từ {rental.start_station.name} → {rental.end_station.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(rental.start_time).toLocaleString("vi-VN")} - {new Date(rental.end_time).toLocaleString("vi-VN")}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-foreground">
                                {parseFloat(rental.total_price.$numberDecimal).toLocaleString()} VND
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {Math.round(rental.duration / 60)} phút
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">Không có lịch sử thuê</p>
                    </div>
                  )}
                </div>
              )}

              {detailTab === "stats" && (
                <div className="space-y-3">
                  <div className="bg-muted rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-3">
                      {/* ID xe - màu primary */}
                      <div className="bg-primary/10 border border-primary rounded p-3">
                        <p className="text-xs text-primary">ID xe</p>
                        <p className="text-2xl font-bold text-primary">
                          {bikeActivityStats?.bike_id.slice(0, 8)}
                        </p>
                      </div>
                      {/* Doanh thu từng tháng */}
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
                      {/* Thời gian sử dụng - màu blue */}
                      <div className="bg-blue-100 border border-blue-300 rounded p-3">
                        <p className="text-xs text-blue-600">
                          Thời gian sử dụng
                        </p>
                        <p className="text-2xl font-bold text-blue-800">
                          {bikeActivityStats?.total_minutes_active || 0} phút
                        </p>
                      </div>
                      {/* Phần trăm thời gian hoạt động - màu green */}
                      <div className="bg-green-100 border border-green-300 rounded p-3">
                        <p className="text-xs text-green-600">
                          Phần trăm thời gian hoạt động
                        </p>
                        <p className="text-2xl font-bold text-green-800">
                          {bikeActivityStats?.uptime_percentage}%
                        </p>
                      </div>
                      {/* Số lượng báo hỏng - màu red */}
                      <div className="bg-red-100 border border-red-300 rounded p-3">
                        <p className="text-xs text-red-600">
                          Số lượng báo hỏng
                        </p>
                        <p className="text-2xl font-bold text-red-800">
                          {bikeActivityStats?.total_reports || 0} báo hỏng
                        </p>
                      </div>
                      {/* Đánh giá trung bình - màu gray nếu chưa có đánh giá */}
                      <div className="bg-gray-100 border border-gray-300 rounded p-3">
                        <p className="text-xs text-gray-600">
                          Đánh giá trung bình
                        </p>
                        <p className="text-2xl font-bold text-gray-800">
                          Chưa có đánh giá
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
                        {/* {bikeActivityStats.monthly_stats.length > 0 && (
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
                        )} */}
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

              <Button
                onClick={() => setIsDetailModalOpen(false)}
                className="w-full mt-6"
              >
                Đóng
              </Button>
            </div>
          </div>
        )}
        {isEditModalOpen && detailBike && (
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
                    value={editBike?.station_id || ""}
                    onChange={(e) =>
                      setEditBike(
                        editBike
                          ? { ...editBike, station_id: e.target.value }
                          : null
                      )
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                  >
                    {stations.map((station) => (
                      <option key={station._id} value={station._id}>
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
                    value={editBike?.supplier_id || ""}
                    onChange={(e) =>
                      setEditBike(
                        editBike
                          ? { ...editBike, supplier_id: e.target.value }
                          : null
                      )
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                  >
                    <option value="">Không có</option>
                    {allSupplier?.data.map((supplier) => (
                      <option key={supplier._id} value={supplier._id}>
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
                    value={editBike?.chip_id || ""}
                    onChange={(e) =>
                      setEditBike(
                        editBike
                          ? { ...editBike, chip_id: e.target.value }
                          : null
                      )
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">
                    Trạng thái
                  </label>
                  <select
                    value={editBike?.status || ""}
                    onChange={(e) =>
                      setEditBike(
                        editBike
                          ? {
                              ...editBike,
                              status: e.target.value as BikeStatus,
                            }
                          : null
                      )
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                  >
                    <option value="CÓ SẴN">Có sẵn</option>
                    <option value="ĐANG ĐƯỢC THUÊ">Đang được thuê</option>
                    <option value="BỊ HỎNG">Bị hỏng</option>
                    <option value="ĐÃ ĐẶT TRƯỚC">Đã đặt trước</option>
                    <option value="ĐANG BẢO TRÌ">Đang bảo trì</option>
                    <option value="KHÔNG CÓ SẴN">Không có sẵn</option>
                  </select>
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
      </div>
    );
}

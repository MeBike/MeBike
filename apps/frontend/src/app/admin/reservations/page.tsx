"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/TableCustom";
import { ReservationStats } from "@/components/reservations/reservation-stats";
import { Button } from "@/components/ui/button";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { useReservationActions } from "@/hooks/use-reservation";
import { useStationActions } from "@/hooks/use-station";
import { reservationColumn } from "@/columns/reservation-columns";
import type { Reservation } from "@/types/Reservation";
import { Loader2 } from "lucide-react";
import { formatDateUTC } from "@/utils/formatDateTime";
export default function ReservationsPage() {
  const { stations } = useStationActions({ hasToken: true });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    Reservation["status"] | "all"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState<number>(10);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<"info" | "stats">("info");
  // const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedReservationId, setSelectedReservationId] =
    useState<string>("");
  const {
    allReservations,
    fetchAllReservations,
    reservationStats,
    fetchReservationStats,
    detailReservation,
    fetchDetailReservation,
  } = useReservationActions({
    hasToken: true,
    page: currentPage,
    limit: limit,
    id: selectedReservationId,
  });
  useEffect(() => {
    fetchAllReservations();
    fetchReservationStats();
  }, [
    fetchAllReservations,
    fetchReservationStats,
    currentPage,
  ]);

  useEffect(() => {
    if (selectedReservationId) {
      fetchDetailReservation();
    }
  }, [selectedReservationId, fetchDetailReservation]);

  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };
  if(!allReservations) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
        <Loader2 className="animate-spin w-16 h-16 text-primary" />
      </div>
    );
  }
  return (
    <div>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Quản lý đặt trước
            </h1>
            <p className="text-muted-foreground mt-1">
              Theo dõi và quản lý các đơn đặt trước xe đạp
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* <Button
              // onClick={() => {
              //   setIsCreateModalOpen(true);
              // }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Tạo đặt trước
            </Button> */}
          </div>
        </div>

        <ReservationStats stats={reservationStats?.result ?? []} />
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Bộ lọc</h3>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Xóa bộ lọc
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tìm kiếm</label>
              <input
                type="text"
                placeholder="Mã đặt trước, mã người dùng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(
                    e.target.value as Reservation["status"] | "all"
                  );
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="all">Tất cả</option>
                <option value="ĐANG CHỜ XỬ LÝ">Đang chờ xử lý</option>
                <option value="ĐANG HOẠT ĐỘNG">Đang hoạt động</option>
                <option value="ĐÃ HẾT HẠN">Đã hết hạn</option>
                <option value="ĐÃ HỦY">Đã hủy</option>
              </select>
            </div>
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Hiển thị trang {currentPage}
          </p>
          <DataTable
            columns={reservationColumn({
              onView: ({ id }) => {
                setSelectedReservationId(id);
                setIsDetailModalOpen(true);
                console.log("[v0] View reservation:", id);
              },
              onEdit: ({ data }) => {
                setSelectedReservationId(data._id);
                console.log("[v0] Edit reservation:", data._id);
              },
              stations: stations,
            })}
            title={"Danh sách đặt trước"}
            searchValue={searchQuery}
            filterPlaceholder="Tìm kiếm theo mã ví hoặc mã người dùng..."
            data={allReservations?.data || []}
          />

          <div className="pt-3">
            <PaginationDemo
              currentPage={currentPage}
              totalPages={1}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>

      {/* Detail Reservation Modal */}
      {isDetailModalOpen && detailReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">
                Chi tiết đặt trước
              </h2>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedReservationId("");
                  setDetailTab("info");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {!detailReservation ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin w-8 h-8 text-primary" />
              </div>
            ) : (
              <>
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
                    onClick={() => setDetailTab("stats")}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      detailTab === "stats"
                        ? "text-primary border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Thống kê
                  </button>
                </div>

                {/* Tab: Info */}
                {detailTab === "info" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Mã đặt trước</p>
                      <p className="text-foreground font-medium">
                        {detailReservation?.result?._id}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Tên người dùng</p>
                      <p className="text-foreground font-medium">
                        {detailReservation?.result?.user?.fullname}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Email người dùng</p>
                      <p className="text-foreground font-medium">
                        {detailReservation?.result?.user?.email}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Số điện thoại</p>
                      <p className="text-foreground font-medium">
                        {detailReservation?.result?.user?.phone_number}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Mã xe đạp</p>
                      <p className="text-foreground font-medium">
                        {detailReservation?.result?.bike?.chip_id}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Trạng thái xe đạp</p>
                      <p className="text-foreground font-medium">
                        {detailReservation?.result?.bike?.status}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Tên trạm</p>
                      <p className="text-foreground font-medium">
                        {detailReservation?.result?.station?.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Địa chỉ trạm</p>
                      <p className="text-foreground font-medium">
                        {detailReservation?.result?.station?.address}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Thời gian bắt đầu</p>
                      <p className="text-foreground font-medium">
                        {detailReservation?.result?.start_time
                          ? new Date(
                              detailReservation?.result?.start_time
                            ).toLocaleString("vi-VN")
                          : "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Thời gian kết thúc</p>
                      <p className="text-foreground font-medium">
                        {detailReservation?.result?.end_time
                          ? new Date(
                              detailReservation?.result?.end_time
                            ).toLocaleString("vi-VN")
                          : "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Tiền cọc</p>
                      <p className="text-foreground font-medium">
                        {detailReservation?.result?.prepaid?.toLocaleString("vi-VN")} VND
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Trạng thái</p>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          detailReservation?.result?.status ===
                          "ĐANG HOẠT ĐỘNG"
                            ? "bg-green-100 text-green-800"
                            : detailReservation?.result?.status ===
                                "ĐANG CHỜ XỬ LÝ"
                              ? "bg-yellow-100 text-yellow-800"
                              : detailReservation?.result?.status ===
                                  "ĐÃ HẾT HẠN"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-red-100 text-red-800"
                        }`}
                      >
                        {detailReservation?.result?.status}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Ngày tạo</p>
                      <p className="text-foreground font-medium">
                        {formatDateUTC(detailReservation?.result?.created_at)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Lần cập nhật cuối</p>
                      <p className="text-foreground font-medium">
                        {formatDateUTC(detailReservation?.result?.updated_at)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tab: Stats */}
                {detailTab === "stats" && (
                  <div className="space-y-3">
                    <div className="bg-muted rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-primary/10 border border-primary rounded p-3">
                          <p className="text-xs text-primary">Mã đặt trước</p>
                          <p className="text-lg font-bold text-primary">
                            {detailReservation?.result?._id.slice(0, 8)}
                          </p>
                        </div>

                        <div className="bg-blue-100 border border-blue-300 rounded p-3">
                          <p className="text-xs text-blue-600">Tên người dùng</p>
                          <p className="text-sm font-bold text-blue-800">
                            {detailReservation?.result?.user?.fullname}
                          </p>
                        </div>

                        <div className="bg-green-100 border border-green-300 rounded p-3">
                          <p className="text-xs text-green-600">Tiền cọc</p>
                          <p className="text-lg font-bold text-green-800">
                            {detailReservation?.result?.prepaid?.toLocaleString("vi-VN")} VND
                          </p>
                        </div>

                        <div className="bg-yellow-100 border border-yellow-300 rounded p-3">
                          <p className="text-xs text-yellow-600">Trạng thái</p>
                          <p className="text-lg font-bold text-yellow-800">
                            {detailReservation?.result?.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedReservationId("");
                  setDetailTab("info");
                }}
                className="flex-1"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

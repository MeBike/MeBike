"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/TableCustom";
import { ReservationStats } from "@/components/reservations/reservation-stats";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { useReservationActions } from "@/hooks/use-reservation";
import { useStationActions } from "@/hooks/useStationAction";
import { reservationColumn } from "@/columns/reservation-columns";
import type { Reservation } from "@/types/Reservation";

export default function ReservationsPage() {
  const { stations, getAllStations } = useStationActions({ hasToken: true });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    Reservation["status"] | "all"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState<number>(10);
  // const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedReservationId, setSelectedReservationId] =
    useState<string>("");
  const {
    allReservations,
    fetchAllReservations,
    reservationStats,
    fetchReservationStats,
  } = useReservationActions({
    hasToken: true,
    page: currentPage,
    limit: limit,
    id: selectedReservationId,
  });
  useEffect(() => {
    fetchAllReservations();
    fetchReservationStats();
    getAllStations();
  }, [
    fetchAllReservations,
    fetchReservationStats,
    getAllStations,
    currentPage,
  ]);

  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };
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
            <Button
              // onClick={() => {
              //   setIsCreateModalOpen(true);
              // }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Tạo đặt trước
            </Button>
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
    </div>
  );
}

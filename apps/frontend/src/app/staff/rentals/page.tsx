"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { RentalFilters } from "@/components/rentals/rental-filters";
import { RentalStats } from "@/components/rentals/rental-stats";
import { Button } from "@/components/ui/button";
import type { RentalStatus } from "@custom-types";
import { Plus, Download } from "lucide-react";
import { useRentalsActions } from "@/hooks/use-rental";
import { useStationActions } from "@/hooks/useStationAction";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { rentalColumn } from "@/columns/rental-columns";
import {
  updateRentalSchema,
  type UpdateRentalSchema,
} from "@schemas/rentalSchema";
export default function RentalsPage() {
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RentalStatus | "all">("all");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedRentalId, setSelectedRentalId] = useState<string>("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UpdateRentalSchema>({
    resolver: zodResolver(updateRentalSchema),
    defaultValues: {
      status: "ĐANG THUÊ",
      end_station: "",
      end_time: "",
      reason: "",
      total_price: 0,
    },
  });
  const {
    allRentalsData,
    pagination,
    detailData,
    getDetailRental,
  } = useRentalsActions({
    hasToken: true,
    limit,
    page,
    bike_id: selectedRentalId,
    status:
      statusFilter !== "all"
        ? statusFilter === "active"
          ? "ĐANG THUÊ"
          : statusFilter === "completed"
            ? "HOÀN THÀNH"
            : statusFilter === "cancelled"
              ? "ĐÃ HỦY"
              : statusFilter === "reserved"
                ? "ĐÃ ĐẶT TRƯỚC"
                : undefined
        : undefined,
  });

  const { stations, getAllStations } = useStationActions({
    hasToken: true,
    page: 1,
    limit: 100,
  });
  useEffect(() => {
    getAllStations();
  }, [getAllStations]);

  const rentals = allRentalsData || [];

  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };


//
  return (
    <div>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Quản lý đơn thuê
            </h1>
            <p className="text-muted-foreground mt-1">
              Theo dõi và quản lý các đơn thuê xe đạp
            </p>
          </div>
          <div className="flex items-center gap-3">
            
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tạo đơn mới
            </Button>
          </div>
        </div>

        {/* Filters */}
        <RentalFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          onReset={handleReset}
        />

        {/* Results */}
        <div className="w-full rounded-lg space-y-4  flex flex-col">
          {/* <RentalTable
            rentals={filteredRentals}
            onView={(rental) => console.log("[v0] View rental:", rental._id)}
            onEdit={(rental) => console.log("[v0] Edit rental:", rental._id)}
            onComplete={(rental) =>
              console.log("[v0] Complete rental:", rental._id)
            }
            onCancel={(rental) =>
              console.log("[v0] Cancel rental:", rental._id)
            }
          /> */}
          <DataTable
            columns={rentalColumn({
              onView: ({ id }) => {
                setSelectedRentalId(id);
                getDetailRental();
                setIsDetailModalOpen(true);
              },
              onEdit: ({ data }) => {
                setSelectedRentalId(data._id);
                getDetailRental();
                reset({
                  status: data.status as
                    | "ĐANG THUÊ"
                    | "HOÀN THÀNH"
                    | "ĐÃ HỦY"
                    | "ĐÃ ĐẶT TRƯỚC",
                  end_station: data.end_station || "",
                  end_time: data.end_time
                    ? new Date(data.end_time).toISOString().slice(0, 16)
                    : "",
                  reason: "",
                  total_price: data.total_price,
                });
                setIsUpdateModalOpen(true);
              },
            })}
            data={rentals}
          />
          <PaginationDemo
            currentPage={pagination?.currentPage ?? 1}
            onPageChange={setPage}
            totalPages={pagination?.totalPages ?? 1}
          />
        </div>

        <p className="text-sm text-muted-foreground">
          Trang {pagination?.currentPage} / {pagination?.totalPages} đơn thuê
        </p>

        {/* {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Tạo đơn thuê mới
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Khách hàng
                  </label>
                  <select
                    value={newRental.customer_id}
                    onChange={(e) =>
                      setNewRental({
                        ...newRental,
                        customer_id: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                  >
                    <option value="">Chọn khách hàng</option>
                    <option value="c1">Nguyễn Văn An</option>
                    <option value="c2">Lê Thị Mai</option>
                    <option value="c3">Phạm Minh Tuấn</option>
                    <option value="c4">Võ Thị Hương</option>
                    <option value="c5">Đặng Quốc Bảo</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">
                    Xe đạp
                  </label>
                  <select
                    value={newRental.bike_id}
                    onChange={(e) =>
                      setNewRental({ ...newRental, bike_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                  >
                    <option value="">Chọn xe đạp</option>
                    <option value="1">Giant Talon 3</option>
                    <option value="2">Trek FX 3</option>
                    <option value="3">VinFast Klara S</option>
                    <option value="4">Specialized Sirrus</option>
                    <option value="5">Cannondale CAAD13</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">
                    Loại thuê
                  </label>
                  <select
                    value={newRental.rental_type}
                    onChange={(e) =>
                      setNewRental({
                        ...newRental,
                        rental_type: e.target.value as "hours" | "days",
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                  >
                    <option value="hours">Theo giờ</option>
                    <option value="days">Theo ngày</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="datetime-local"
                    value={newRental.start_date}
                    onChange={(e) =>
                      setNewRental({ ...newRental, start_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">
                    Ngày kết thúc
                  </label>
                  <input
                    type="datetime-local"
                    value={newRental.end_date}
                    onChange={(e) =>
                      setNewRental({ ...newRental, end_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">
                    Phương thức thanh toán
                  </label>
                  <select
                    value={newRental.payment_method}
                    onChange={(e) =>
                      setNewRental({
                        ...newRental,
                        payment_method: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                  >
                    <option value="card">Thẻ tín dụng</option>
                    <option value="cash">Tiền mặt</option>
                    <option value="momo">Momo</option>
                    <option value="zalopay">ZaloPay</option>
                    <option value="transfer">Chuyển khoản</option>
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
                <Button onClick={handleCreateRental} className="flex-1">
                  Tạo đơn thuê
                </Button>
              </div>
            </div>
          </div>
        )}


        {/* Detail Modal */}
        {isDetailModalOpen && detailData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">
                  Chi tiết đơn thuê
                </h2>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Row 1 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Mã đơn thuê
                    </label>
                    <p className="text-foreground font-medium">
                      {detailData.result?._id}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Trạng thái
                    </label>
                    <p className="text-foreground font-medium">
                      {detailData.result?.status}
                    </p>
                  </div>
                </div>

                {/* Row 2 - User Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Tên người dùng
                    </label>
                    <p className="text-foreground font-medium">
                      {detailData.result?.user?.fullname}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Email
                    </label>
                    <p className="text-foreground text-sm">
                      {detailData.result?.user?.email}
                    </p>
                  </div>
                </div>

                {/* Row 3 - User Contact */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Số điện thoại
                    </label>
                    <p className="text-foreground font-medium">
                      {detailData.result?.user?.phone_number}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Trạng thái xác minh
                    </label>
                    <p className="text-foreground font-medium">
                      {detailData.result?.user?.verify}
                    </p>
                  </div>
                </div>

                {/* Row 4 - Bike Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Mã xe đạp
                    </label>
                    <p className="text-foreground font-medium">
                      {detailData.result?.bike?._id}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Chip ID
                    </label>
                    <p className="text-foreground font-medium">
                      {detailData.result?.bike?.chip_id}
                    </p>
                  </div>
                </div>

                {/* Row 5 - Bike Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Trạng thái xe
                    </label>
                    <p className="text-foreground font-medium">
                      {detailData.result?.bike?.status}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Nhà cung cấp
                    </label>
                    <p className="text-foreground font-medium">
                      {detailData.result?.bike?.supplier_id}
                    </p>
                  </div>
                </div>

                {/* Row 6 - Start Station */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Trạm bắt đầu
                    </label>
                    <p className="text-foreground font-medium">
                      {detailData.result?.start_station?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {detailData.result?.start_station?.address}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Tọa độ trạm bắt đầu
                    </label>
                    <p className="text-foreground text-sm">
                      {detailData.result?.start_station?.latitude},{" "}
                      {detailData.result?.start_station?.longitude}
                    </p>
                  </div>
                </div>

                {/* Row 7 - End Station */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Trạm kết thúc
                    </label>
                    <p className="text-foreground font-medium">
                      {detailData.result?.end_station?.name || "Chưa trả"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {detailData.result?.end_station?.address || ""}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Tọa độ trạm kết thúc
                    </label>
                    <p className="text-foreground text-sm">
                      {detailData.result?.end_station
                        ? `${detailData.result.end_station.latitude}, ${detailData.result.end_station.longitude}`
                        : "Chưa trả"}
                    </p>
                  </div>
                </div>

                {/* Row 8 - Times */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Thời gian bắt đầu
                    </label>
                    <p className="text-foreground text-sm">
                      {new Date(detailData.result?.start_time).toLocaleString(
                        "vi-VN"
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Thời gian kết thúc
                    </label>
                    <p className="text-foreground text-sm">
                      {detailData.result?.end_time
                        ? new Date(detailData.result.end_time).toLocaleString(
                            "vi-VN"
                          )
                        : "Chưa trả"}
                    </p>
                  </div>
                </div>

                {/* Row 9 - Duration & Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Thời lượng (phút)
                    </label>
                    <p className="text-foreground font-medium">
                      {detailData.result?.duration}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Tổng tiền
                    </label>
                    <p className="text-foreground font-medium">
                      {detailData.result?.total_price?.toLocaleString("vi-VN")}{" "}
                      VND
                    </p>
                  </div>
                </div>

                {/* Row 10 - Timestamps */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Ngày tạo
                    </label>
                    <p className="text-foreground text-sm">
                      {new Date(detailData.result?.created_at).toLocaleString(
                        "vi-VN"
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Cập nhật lần cuối
                    </label>
                    <p className="text-foreground text-sm">
                      {new Date(detailData.result?.updated_at).toLocaleString(
                        "vi-VN"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="flex-1"
                >
                  Đóng
                </Button>
                <Button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setIsUpdateModalOpen(true);
                  }}
                  className="flex-1"
                >
                  Cập nhật
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Update Modal */}
        {isUpdateModalOpen && detailData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Cập nhật đơn thuê
              </h2>

              <form
                onSubmit={handleSubmit(handleUpdateRental)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Trạng thái
                    </label>
                    <select
                      {...register("status")}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                    >
                      {detailData.result?.status === "ĐANG THUÊ" && (
                        <>
                          <option value="ĐANG THUÊ">ĐANG THUÊ</option>
                          <option value="ĐÃ HOÀN THÀNH">ĐÃ HOÀN THÀNH</option>
                          <option value="ĐÃ HỦY">ĐÃ HỦY</option>
                        </>
                      )}
                      {detailData.result?.status === "ĐÃ HOÀN THÀNH" && (
                        <>
                          <option value="ĐÃ HOÀN THÀNH">ĐÃ HOÀN THÀNH</option>
                          <option value="ĐÃ HỦY">ĐÃ HỦY</option>
                        </>
                      )}
                      {detailData.result?.status === "ĐÃ HỦY" && (
                        <option value="ĐÃ HỦY">ĐÃ HỦY</option>
                      )}
                    </select>
                    {errors.status && (
                      <p className="text-red-500 text-sm">
                        {errors.status.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Trạm kết thúc
                    </label>
                    <select
                      {...register("end_station")}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                    >
                      <option value="">Chọn trạm</option>
                      {stations.map((station) => (
                        <option key={station._id} value={station._id}>
                          {station.name} - {station.address}
                        </option>
                      ))}
                    </select>
                    {errors.end_station && (
                      <p className="text-red-500 text-sm">
                        {errors.end_station.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Thời gian kết thúc
                    </label>
                    <input
                      type="datetime-local"
                      {...register("end_time")}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                    />
                    {errors.end_time && (
                      <p className="text-red-500 text-sm">
                        {errors.end_time.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Tổng tiền
                    </label>
                    <input
                      type="number"
                      {...register("total_price", { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                    />
                    {errors.total_price && (
                      <p className="text-red-500 text-sm">
                        {errors.total_price.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Lý do
                  </label>
                  <textarea
                    {...register("reason")}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                    rows={3}
                  />
                  {errors.reason && (
                    <p className="text-red-500 text-sm">
                      {errors.reason.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsUpdateModalOpen(false)}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? "Đang cập nhật..." : "Cập nhật"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { RentalFilters } from "@/components/rentals/rental-filters";
import { RentalStats } from "@/components/rentals/rental-stats";
import { Button } from "@/components/ui/button";
import type {
  RentalStatus,
  PaymentStatus,
} from "@custom-types";
import { Plus, Download } from "lucide-react";
import { useRentalsActions } from "@/hooks/useRentalAction";
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
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | "all">(
    "all"
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedRentalId, setSelectedRentalId] = useState<string>("");
  const [newRental, setNewRental] = useState({
    customer_id: "",
    bike_id: "",
    start_date: "",
    end_date: "",
    rental_type: "hours" as "hours" | "days",
    payment_method: "card" as "card" | "cash" | "momo" | "zalopay" | "transfer",
  });
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
    getRentals,
    isAllRentalsLoading,
    pagination,
    revenueData,
    detailData,
    getDetailRental,
    getRevenue,
    refetchRevenue,
    isLoadingRevenue,
    updateRental,
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
    getRevenue();
    getAllStations();
  }, [getRevenue, getAllStations]);

  const rentals = allRentalsData || [];
  const filteredRentals = rentals.filter((rental) => {
    const matchesSearch =
      rental._id.includes(searchQuery) ||
      rental.user_id.includes(searchQuery) ||
      rental.bike_id.includes(searchQuery);

    const statusMap = {
      "ĐANG THUÊ": "active",
      "HOÀN THÀNH": "completed",
      "ĐÃ HỦY": "cancelled",
    };

    const mappedStatus =
      statusMap[rental.status as keyof typeof statusMap] || "pending";

    const matchesStatus =
      statusFilter === "all" || mappedStatus === statusFilter;
    const matchesPayment = paymentFilter === "all";

    const matchesDateFrom =
      !dateFrom || new Date(rental.start_time) >= new Date(dateFrom);
    const matchesDateTo =
      !dateTo || new Date(rental.start_time) <= new Date(dateTo);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPayment &&
      matchesDateFrom &&
      matchesDateTo
    );
  });

  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const handleCreateRental = () => {
    if (
      !newRental.customer_id ||
      !newRental.bike_id ||
      !newRental.start_date ||
      !newRental.end_date
    ) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }
    console.log("[v0] Create rental:", newRental);
    setIsCreateModalOpen(false);
    setNewRental({
      customer_id: "",
      bike_id: "",
      start_date: "",
      end_date: "",
      rental_type: "hours",
      payment_method: "card",
    });
  };

  const handleUpdateRental = (data: UpdateRentalSchema) => {
    updateRental(data, selectedRentalId);
    setIsUpdateModalOpen(false);
  };

  const stats = {
    pending: rentals.filter((r) => {
      const statusMap = {
        "ĐANG THUÊ": "active",
        "HOÀN THÀNH": "completed",
        "ĐÃ HỦY": "cancelled",
      };
      return (
        (statusMap[r.status as keyof typeof statusMap] || "pending") ===
        "pending"
      );
    }).length,
    active: rentals.filter((r) => r.status === "ĐANG THUÊ").length,
    completed: rentals.filter((r) => r.status === "HOÀN THÀNH").length,
    cancelled: rentals.filter((r) => r.status === "ĐÃ HỦY").length,
    overdue: 0, // No overdue in RentingHistory
    todayRevenue:
      revenueData?.result?.data?.reduce(
        (sum: number, item: any) => sum + item.totalRevenue,
        0
      ) || 0,
    totalRevenue:
      revenueData?.result?.data?.reduce(
        (sum: number, item: any) => sum + item.totalRevenue,
        0
      ) || 0,
  };

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
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Xuất Excel
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tạo đơn mới
            </Button>
          </div>
        </div>

        {/* Stats */}
        <RentalStats stats={stats} />

        {/* Filters */}
        <RentalFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          paymentFilter={paymentFilter}
          onPaymentChange={setPaymentFilter}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
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
                  status: data.status as any,
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
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Chi tiết đơn thuê
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Mã đơn thuê
                    </label>
                    <p className="text-foreground">{detailData.result?._id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Trạng thái
                    </label>
                    <p className="text-foreground">
                      {detailData.result?.status}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Người dùng
                    </label>
                    <p className="text-foreground">
                      {detailData.result?.user?.fullname}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {detailData.result?.user?.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Xe đạp
                    </label>
                    <p className="text-foreground">
                      {detailData.result?.bike?._id}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Trạm bắt đầu
                    </label>
                    <p className="text-foreground">
                      {detailData.result?.start_station?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {detailData.result?.start_station?.address}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Trạm kết thúc
                    </label>
                    <p className="text-foreground">
                      {detailData.result?.end_station?.name || "Chưa trả"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {detailData.result?.end_station?.address || ""}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Thời gian bắt đầu
                    </label>
                    <p className="text-foreground">
                      {new Date(detailData.result?.start_time).toLocaleString(
                        "vi-VN"
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Thời gian kết thúc
                    </label>
                    <p className="text-foreground">
                      {detailData.result?.end_time
                        ? new Date(detailData.result.end_time).toLocaleString(
                            "vi-VN"
                          )
                        : "Chưa trả"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Thời lượng (phút)
                    </label>
                    <p className="text-foreground">
                      {detailData.result?.duration}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Tổng tiền
                    </label>
                    <p className="text-foreground">
                      {detailData.result?.total_price.toLocaleString("vi-VN")}{" "}
                      VND
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
                        <option value="HOÀN THÀNH">HOÀN THÀNH</option>
                      )}
                      {detailData.result?.status === "ĐÃ ĐẶT TRƯỚC" && (
                        <option value="ĐANG THUÊ">ĐANG THUÊ</option>
                      )}
                      {detailData.result?.status === "HOÀN THÀNH" && (
                        <>
                          <option value="HOÀN THÀNH">HOÀN THÀNH</option>
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

"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/TableCustom";
import { Button } from "@/components/ui/button";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { useStationActions } from "@/hooks/use-station";
import { reservationColumnForStaff } from "@/columns/reservation-columns";
import { useAgencyActions } from "@/hooks/use-agency";
import type {
  Reservation,
  ReservationOption,
  ReservationStatus,
} from "@/types/Reservation";
import { useRouter } from "next/navigation";
import { TableSkeleton } from "@/components/table-skeleton";
export default function ReservationClient() {
  const { stations } = useStationActions({ hasToken: true });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus>("");
  const [option, setReservationOption] = useState<ReservationOption>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState<number>(7);
  const router = useRouter();
  const {
    allReservationsAgency,
    getReservationsForAgency,
    isLoadingReservationsAgency,
  } = useAgencyActions({
    hasToken: true,
    page: currentPage,
    pageSize: pageSize,
    renservation_status: statusFilter,
  });
  const [isVisualLoading, setIsVisualLoading] = useState(false);

  useEffect(() => {
    if (isLoadingReservationsAgency) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingReservationsAgency]);
  useEffect(() => {
    getReservationsForAgency();
  }, [getReservationsForAgency, currentPage, pageSize]);
  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };
  const handleDetailReservation = (id: string) => {
    router.push(`/agency/reservations/detail/${id}`);
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
          <div className="flex items-center gap-3"></div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Bộ lọc</h3>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Xóa bộ lọc
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* <div className="space-y-2">
              <label className="text-sm font-medium">Tìm kiếm</label>
              <input
                type="text"
                placeholder="Mã đặt trước, mã người dùng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              />
            </div> */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as ReservationStatus);
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="">Tất cả</option>
                <option value="PENDING">Đang chờ xử lý</option>
                <option value="FULFILLED">Đang hoạt động</option>
                <option value="EXPIRED">Đã hết hạn</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>
          </div>
        </div>
        <div className="min-h-[700px]">
          {isVisualLoading ? (
            <TableSkeleton />
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Hiển thị trang {currentPage} /{" "}
                {allReservationsAgency?.pagination.totalPages}
              </p>
              <DataTable
                columns={reservationColumnForStaff({
                  onView: ({ id }) => {
                    handleDetailReservation(id);
                  },
                  stations: stations,
                })}
                title={"Danh sách đặt trước"}
                searchValue={searchQuery}
                filterPlaceholder="Tìm kiếm theo mã ví hoặc mã người dùng..."
                data={allReservationsAgency?.data || []}
              />

              <div className="pt-3">
                <PaginationDemo
                  currentPage={allReservationsAgency?.pagination.page ?? 1}
                  totalPages={allReservationsAgency?.pagination.totalPages ?? 1}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

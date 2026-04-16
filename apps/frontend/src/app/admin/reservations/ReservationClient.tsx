"use client";

import { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/TableCustom";
import { Button } from "@/components/ui/button";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { reservationColumn } from "@/columns/reservation-columns";
import { ReservationStats } from "@/components/reservations/reservation-stats";
import { TableSkeleton } from "@/components/table-skeleton";
import type { Reservation, ReservationStatus ,ReservationOverview , Station} from "@custom-types";
import { ApiResponse } from "@/types";

interface ReservationClientProps {
  data: {
    allReservations?: ApiResponse<Reservation[]>;
    reservationStats?: ReservationOverview;
    stations: Station[];
    isVisualLoading: boolean;
  };
  filters: {
    searchQuery: string;
    statusFilter: ReservationStatus | "";
    currentPage: number;
  };
  actions: {
    setSearchQuery: Dispatch<SetStateAction<string>>;
    setStatusFilter: Dispatch<SetStateAction<ReservationStatus | "">>;
    setCurrentPage: Dispatch<SetStateAction<number>>;
    setSelectedReservationId: Dispatch<SetStateAction<string>>;
    handleReset: () => void;
    handleFilterChange: () => void;
  };
}

export default function ReservationClient({
  data: { allReservations, reservationStats, stations, isVisualLoading },
  filters: { searchQuery, statusFilter, currentPage },
  actions: {
    setSearchQuery,
    setStatusFilter,
    setCurrentPage,
    setSelectedReservationId,
    handleReset,
    handleFilterChange,
  },
}: ReservationClientProps) {
  const router = useRouter();

  const handleDetailReservation = (id: string) => {
    router.push(`/admin/reservations/detail/${id}`);
  };

  return (
    <div>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Quản lý đặt trước
            </h1>
            <p className="mt-1 text-muted-foreground">
              Theo dõi và quản lý các đơn đặt trước xe đạp
            </p>
          </div>
          <div className="flex items-center gap-3"></div>
        </div>

        {reservationStats && <ReservationStats overview={reservationStats} />}

        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Bộ lọc</h3>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Xóa bộ lọc
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as ReservationStatus);
                  handleFilterChange();
                }}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
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
              <p className="mb-4 text-sm text-muted-foreground">
                Hiển thị trang {currentPage} /{" "}
                {allReservations?.pagination?.totalPages ?? 1}
              </p>
              <DataTable
                columns={reservationColumn({
                  onView: ({ id }) => {
                    handleDetailReservation(id);
                  },
                  onEdit: ({ data }) => {
                    setSelectedReservationId(data.id);
                    console.log("[v0] Edit reservation:", data.id);
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
                  currentPage={allReservations?.pagination?.page ?? 1}
                  totalPages={allReservations?.pagination?.totalPages ?? 1}
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
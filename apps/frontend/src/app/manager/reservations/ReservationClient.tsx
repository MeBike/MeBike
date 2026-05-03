"use client";

import { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/TableCustom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListFilter, RotateCcw, Tag, Activity, User, Bike } from "lucide-react";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { reservationColumnForStaff } from "@/columns/reservation-columns"; // Dùng column của Staff
import { TableSkeleton } from "@/components/table-skeleton";
import type {
  Reservation,
  ReservationStatus,
  ReservationOption,
  Station,
} from "@/types";
import { ApiResponse } from "@/types";

interface ReservationClientProps {
  data: {
    allReservationsStaff?: ApiResponse<Reservation[]>;
    stations: Station[];
    isVisualLoading: boolean;
  };
  filters: {
    searchQuery: string;
    statusFilter: ReservationStatus | "";
    option: ReservationOption | "";
    userId: string;
    bikeId: string;
    currentPage: number;
  };
  actions: {
    setSearchQuery: Dispatch<SetStateAction<string>>;
    setStatusFilter: Dispatch<SetStateAction<ReservationStatus | "">>;
    setReservationOption: Dispatch<SetStateAction<ReservationOption | "">>;
    setUserId: Dispatch<SetStateAction<string>>;
    setBikeId: Dispatch<SetStateAction<string>>;
    setCurrentPage: Dispatch<SetStateAction<number>>;
    setSelectedReservationId: Dispatch<SetStateAction<string>>;
    handleReset: () => void;
    handleFilterChange: () => void;
  };
}

export default function ReservationClient({
  data: { allReservationsStaff, stations, isVisualLoading },
  filters: { searchQuery, statusFilter, option, userId, bikeId, currentPage },
  actions: {
    setSearchQuery,
    setStatusFilter,
    setReservationOption,
    setUserId,
    setBikeId,
    setCurrentPage,
    setSelectedReservationId,
    handleReset,
    handleFilterChange,
  },
}: ReservationClientProps) {
  const router = useRouter();

  const handleDetailReservation = (id: string) => {
    router.push(`/manager/reservations/detail/${id}`); // Path cho Staff
  };

  const isFiltering =
    statusFilter !== "" || option !== "" || userId !== "" || bikeId !== "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Quản lý đặt trước (Staff)
          </h1>
          <p className="mt-1 text-muted-foreground">
            Theo dõi và quản lý các đơn đặt trước xe đạp tại trạm
          </p>
        </div>
      </div>

      {/* --- BỘ LỌC NÂNG CAO --- */}
      <div className="rounded-xl border border-border bg-card shadow-sm transition-all">
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <ListFilter className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold tracking-tight">
              Bộ lọc nâng cao
            </span>
          </div>

          {isFiltering && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 w-8 rounded-full p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-6 p-4">
          {/* Lọc Trạng thái */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Activity className="h-3 w-3" />
              Trạng thái
            </label>
            <Select
              value={statusFilter || "all"}
              onValueChange={(val) => {
                setStatusFilter(val === "all" ? "" : (val as ReservationStatus));
                handleFilterChange();
              }}
            >
              <SelectTrigger className="h-9 w-[180px] border-border/60 bg-background/50 text-sm focus:ring-1 focus:ring-primary">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="PENDING">Đang chờ xử lý</SelectItem>
                <SelectItem value="FULFILLED">Đang hoạt động</SelectItem>
                <SelectItem value="EXPIRED">Đã hết hạn</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lọc Hình thức */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Tag className="h-3 w-3" />
              Hình thức
            </label>
            <Select
              value={option || "all"}
              onValueChange={(val) => {
                setReservationOption(val === "all" ? "" : (val as ReservationOption));
                handleFilterChange();
              }}
            >
              <SelectTrigger className="h-9 w-[200px] border-border/60 bg-background/50 text-sm focus:ring-1 focus:ring-primary">
                <SelectValue placeholder="Tất cả hình thức" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả hình thức</SelectItem>
                <SelectItem value="ONE_TIME">Thuê một lần</SelectItem>
                <SelectItem value="FIXED_SLOT">Khung giờ cố định</SelectItem>
                <SelectItem value="SUBSCRIPTION">Gói đăng ký</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lọc User ID */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <User className="h-3 w-3" />
              Mã người dùng
            </label>
            <Input
              placeholder="Nhập User ID..."
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                handleFilterChange();
              }}
              className="h-9 w-[180px] border-border/60 bg-background/50 text-sm focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Lọc Bike ID */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Bike className="h-3 w-3" />
              Mã xe đạp
            </label>
            <Input
              placeholder="Nhập Bike ID..."
              value={bikeId}
              onChange={(e) => {
                setBikeId(e.target.value);
                handleFilterChange();
              }}
              className="h-9 w-[180px] border-border/60 bg-background/50 text-sm focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="min-h-[700px]">
        {isVisualLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Hiển thị trang {currentPage} /{" "}
                {allReservationsStaff?.pagination?.totalPages ?? 1}
              </p>
            </div>
            <DataTable
              columns={reservationColumnForStaff({
                onView: ({ id }) => handleDetailReservation(id),
                stations: stations,
              })}
              title={"Danh sách đặt trước"}
              searchValue={searchQuery}
              filterPlaceholder="Tìm kiếm..."
              data={allReservationsStaff?.data || []}
            />

            <div className="pt-3">
              <PaginationDemo
                currentPage={allReservationsStaff?.pagination?.page ?? 1}
                totalPages={allReservationsStaff?.pagination?.totalPages ?? 1}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
"use client";

import { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/TableCustom";
import { Button } from "@/components/ui/button";
import { staffColumns } from "@/columns/staff-columns";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { TableSkeleton } from "@/components/table-skeleton";
import type { ApiResponse, DetailUser, UserRole } from "@custom-types";
import type { UserStatusFilter } from "./page";
interface StaffClientProps {
  data: {
    staffOnly?: ApiResponse<DetailUser[]>;
    isVisualLoading: boolean;
  };
  filters: {
    searchQuery: string;
    verifyFilter: UserStatusFilter;
    roleFilter: UserRole | "";
    currentPage: number;
  };
  actions: {
    setSearchQuery: Dispatch<SetStateAction<string>>;
    setVerifyFilter: Dispatch<SetStateAction<UserStatusFilter>>;
    setRoleFilter: Dispatch<SetStateAction<UserRole | "">>;
    setCurrentPage: Dispatch<SetStateAction<number>>;
    handleReset: () => void;
    handleFilterChange: () => void;
  };
}

export default function StaffClient({
  data: { staffOnly, isVisualLoading },
  filters: { searchQuery, verifyFilter, currentPage },
  actions: {
    setSearchQuery,
    setVerifyFilter,
    setCurrentPage,
    handleReset,
    handleFilterChange,
  },
}: StaffClientProps) {
  const router = useRouter();

  const handleDetailUser = (id: string) => {
    router.push(`/admin/staffs/detail/${id}`);
  };

  return (
    <div>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Quản lý nhân viên
            </h1>
            <p className="mt-1 text-muted-foreground">
              Theo dõi và quản lý thông tin nhân viên hệ thống
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                router.push("/admin/staffs/create");
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm nhân viên
            </Button>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Bộ lọc</h3>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Xóa bộ lọc
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Trạng thái xác thực</label>
              <select
                value={verifyFilter}
                onChange={(e) => {
                  setVerifyFilter(e.target.value as UserStatusFilter);
                  handleFilterChange();
                }}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
              >
                <option value="all">Tất cả</option>
                <option value="VERIFIED">Đã xác thực</option>
                <option value="UNVERIFIED">Chưa xác thực</option>
                <option value="BANNED">Bị cấm</option>
              </select>
            </div>
            
            {/* Bạn có thể thêm Select cho roleFilter ở đây nếu cần thiết trong tương lai */}
          </div>
        </div>

        <div>
          <div className="min-h-[700px]">
            {isVisualLoading ? (
              <TableSkeleton />
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  Hiển thị {staffOnly?.pagination?.page ?? 1} /{" "}
                  {staffOnly?.pagination?.totalPages ?? 1} trang
                </p>

                <DataTable
                  title="Danh sách nhân viên"
                  tableClassName="table-fixed"
                  columns={staffColumns({
                    onView: (staff) => handleDetailUser(String(staff.id)),
                  })}
                  data={staffOnly?.data || []}
                  searchValue={searchQuery}
                  filterPlaceholder="Tìm kiếm nhân viên"
                  onSearchChange={setSearchQuery}
                />
                
                <div className="pt-3">
                  <PaginationDemo
                    currentPage={currentPage}
                    totalPages={staffOnly?.pagination?.totalPages ?? 1}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
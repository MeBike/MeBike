"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/TableCustom";
import { Button } from "@/components/ui/button";
import type { VerifyStatus, UserRole } from "@custom-types";
import { Plus } from "lucide-react";
import { useUserActions } from "@/hooks/use-user";
import { staffColumns } from "@/columns/staff-columns";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { useRouter } from "next/navigation";
import { TableSkeleton } from "@/components/table-skeleton";
type UserStatusFilter = VerifyStatus | "BANNED" | "all";

export default function StaffClient() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [verifyFilter, setVerifyFilter] = useState<UserStatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState<number>(7);
  const { staffOnly, isLoadingStaffOnly, getAllStaffs } = useUserActions({
    hasToken: true,
    limit: limit,
    page: currentPage,
    fullName: searchQuery,
  });
  
  useEffect(() => {
    getAllStaffs();
  }, [searchQuery, verifyFilter, roleFilter, currentPage]);
  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter]);
  const handleReset = () => {
    setSearchQuery("");
    setVerifyFilter("all");
    setRoleFilter("all");
    setCurrentPage(1);
  };
  const handleFilterChange = () => {
    setCurrentPage(1);
  };
  const [isVisualLoading, setIsVisualLoading] = useState(false);

  useEffect(() => {
    if (isLoadingStaffOnly) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingStaffOnly]);
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
            <p className="text-muted-foreground mt-1">
              Theo dõi và quản lý thông tin nhân viên hệ thống
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                router.push("/admin/staffs/create");
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm nhân viên
            </Button>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Bộ lọc</h3>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Xóa bộ lọc
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Trạng thái xác thực</label>
              <select
                value={verifyFilter}
                onChange={(e) => {
                  setVerifyFilter(e.target.value as UserStatusFilter);
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="all">Tất cả</option>
                <option value="VERIFIED">Đã xác thực</option>
                <option value="UNVERIFIED">Chưa xác thực</option>
                <option value="BANNED">Bị cấm</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Vai trò</label>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value as UserRole | "all");
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="all">Tất cả</option>
                <option value="ADMIN">Admin</option>
                <option value="STAFF">Staff</option>
                <option value="USER">User</option>
              </select>
            </div>
          </div>
        </div>
        <div>
          <div className="min-h-[700px]">
            {isVisualLoading ? (
              <TableSkeleton />
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
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

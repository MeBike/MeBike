"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { DataTable } from "@/components/TableCustom";
import { CustomerStats } from "@/components/customers/customer-stats";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@radix-ui/react-label";
import { CreateUserFormData, createUserSchema } from "@/schemas/user-schema";
import type { VerifyStatus, UserRole } from "@custom-types";
import { Plus } from "lucide-react";
import { useUserActions } from "@/hooks/use-user";
import { userColumns } from "@/columns/user-columns";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/table-skeleton";
type UserStatusFilter = VerifyStatus | "BANNED" | "all";

export default function CustomersClient() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [verifyFilter, setVerifyFilter] = useState<UserStatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState<number>(10);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const verifyQuery =
    verifyFilter === "VERIFIED" || verifyFilter === "UNVERIFIED"
      ? verifyFilter
      : "";
  const accountStatusQuery = verifyFilter === "BANNED" ? "BANNED" : "";
  const {
    users,
    getAllUsers,
    isLoading,
    getAllStatistics,
    isLoadingStatistics,
    createUser,
    isFetching,
    paginationUser,
    dashboardStatsData,
    getRefetchDashboardStats,
  } = useUserActions({
    hasToken: true,
    limit: limit,
    page: currentPage,
    verify: verifyFilter === "all" ? "" : verifyQuery,
    accountStatus: verifyFilter === "all" ? "" : accountStatusQuery,
    role: roleFilter === "all" ? "" : (roleFilter as UserRole),
    fullName: searchQuery,
  });
  useEffect(() => {
    getAllUsers();
    getAllStatistics();
    getRefetchDashboardStats();
  }, [
    searchQuery,
    verifyFilter,
    roleFilter,
    getAllUsers,
    getAllStatistics,
    currentPage,
    getRefetchDashboardStats,
  ]);
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
  // if (isLoading) {
  //   return (
  //     <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
  //       <Loader2 className="animate-spin w-16 h-16 text-primary" />
  //     </div>
  //   );
  // }
  const [isVisualLoading, setIsVisualLoading] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600); 
      return () => clearTimeout(timer);
    }
  }, [isLoading]);
  const handleDetailUser = (id: string) => {
    router.push(`/admin/customers/detail/${id}`);
  };
  const handleWalletUser = (id: string) => {
    router.push(`/admin/customers/wallet/${id}`);
  };
  return (
    <div>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Quản lý người dùng
            </h1>
            <p className="text-muted-foreground mt-1">
              Theo dõi và quản lý thông tin người dùng hệ thống
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                router.push("/admin/customers/create")
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm người dùng
            </Button>
          </div>
        </div>

        {dashboardStatsData && <CustomerStats stats={dashboardStatsData} />}

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
          {/* <DataTable
            title="Danh sách người dùng"
            tableClassName="table-fixed"
            columns={userColumns({
              onView: (user) => {
                handleDetailUser(String(user.id));
              },
              onViewWallet: (user) => {
                handleWalletUser(String(user.id));
              },
            })}
            data={users || []}
            searchValue={searchQuery}
            filterPlaceholder="Tìm kiếm người dùng"
            onSearchChange={setSearchQuery}
          />

          <div className="pt-3">
            <PaginationDemo
              currentPage={currentPage}
              totalPages={paginationUser?.totalPages ?? 1}
              onPageChange={setCurrentPage}
            />
          </div> */}

          <div className="min-h-[400px]">
            {isVisualLoading ? (
              <TableSkeleton />
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Hiển thị {paginationUser?.page ?? 1} /{" "}
                  {paginationUser?.totalPages ?? 1} trang
                </p>

                <DataTable
                  title="Danh sách người dùng"
                  tableClassName="table-fixed"
                  columns={userColumns({
                    onView: (user) => handleDetailUser(String(user.id)),
                    onViewWallet: (user) => handleWalletUser(String(user.id)),
                  })}
                  data={users || []}
                  searchValue={searchQuery}
                  filterPlaceholder="Tìm kiếm người dùng"
                  onSearchChange={setSearchQuery}
                />

                <div className="pt-3">
                  <PaginationDemo
                    currentPage={currentPage}
                    totalPages={paginationUser?.totalPages ?? 1}
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

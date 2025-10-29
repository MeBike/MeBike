"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { CustomerCard } from "@/components/customers/customer-card";
import { CustomerStats } from "@/components/customers/customer-stats";
import { Button } from "@/components/ui/button";
import type { VerifyStatus, UserRole, DetailUser } from "@custom-types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useUserActions } from "@/hooks/useUserAction";

export default function CustomersPage() {

  const [searchQuery, setSearchQuery] = useState("");
  const [verifyFilter, setVerifyFilter] = useState<VerifyStatus | "all">("all");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState<number>(5);
  // const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const {
    users,
    getAllUsers,
    isFetching,
    getAllStatistics,
    isLoadingStatistics,
    statistics,
    getSearchUsers,
    paginationUser,
  } = useUserActions({
    hasToken: true,
    limit: limit,
    page: currentPage,
    verify: verifyFilter === "all" ? "" : verifyFilter,
    role: roleFilter === "all" ? "" : (roleFilter as UserRole),
    searchQuery: searchQuery,
  });

  const totalPages = paginationUser?.totalPages ?? 1;
  useEffect(() => {
    getAllUsers();
    getAllStatistics();
  }, [
    searchQuery,
    verifyFilter,
    roleFilter,
    getAllUsers,
    getAllStatistics,
    currentPage,
  ]);
  const handleReset = () => {
    setSearchQuery("");
    setVerifyFilter("all");
    setRoleFilter("all");
    setCurrentPage(1);
  };
  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };
  const handleNextPage = () => {
    setCurrentPage((prev) =>
      Math.min(prev + 1, paginationUser?.totalPages ?? 1)
    );
  };
  useEffect(() => {
    if (!searchQuery) getAllUsers();
    else getSearchUsers();
  }, [searchQuery, verifyFilter, roleFilter, getAllUsers, getSearchUsers]);
  if (isFetching && isLoadingStatistics) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
        <Loader2 className="animate-spin w-16 h-16 text-primary" />
      </div>
    );
  }
  // if (isLoadingSearch) {
  //   return (
  //     <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
  //       <Loader2 className="animate-spin w-16 h-16 text-primary" />
  //     </div>
  //   );
  // }
  // const handleCreateUser = handleSubmit((data) => {
  //   createUser({
  //     fullname: data.fullname,
  //     email: data.email,
  //     verify: "UNVERIFIED" as VerifyStatus,
  //     phone_number: data.phone_number,
  //     password: data.password,
  //     role: data.role,
  //   });
  //   console.log("[v0] Create user:", data);
  //   setIsCreateModalOpen(false);
  //   reset();
  // });
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
          {/* <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setIsCreateModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm người dùng
            </Button>
          </div> */}
        </div>

        <CustomerStats
          stats={
            statistics?.result ?? {
              total_users: 0,
              total_verified: 0,
              total_unverified: 0,
              total_banned: 0,
              // admins: 0,
              // staffs: 0,
              // users: 0,
            }
          }
        />

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Bộ lọc</h3>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Xóa bộ lọc
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tìm kiếm</label>
              <input
                type="text"
                placeholder="Tên, email, SĐT, username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Trạng thái xác thực</label>
              <select
                value={verifyFilter}
                onChange={(e) =>
                  setVerifyFilter(e.target.value as VerifyStatus | "all")
                }
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
                onChange={(e) =>
                  setRoleFilter(e.target.value as UserRole | "all")
                }
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
          <p className="text-sm text-muted-foreground mb-4">
            Hiển thị {paginationUser?.currentPage ?? 1} /{" "}
            {paginationUser?.totalPages ?? 1} trang
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users?.map((user) => (
              <CustomerCard
                key={user._id}
                customer={user as DetailUser}
                onView={(user) => console.log("[v0] View user:", user._id)}
                onEdit={(user) => console.log("[v0] Edit user:", user._id)}
                onBlock={(user) => console.log("[v0] Block user:", user._id)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Trang {currentPage} / {paginationUser?.totalPages ?? 1}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Trước
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const page = Math.max(1, currentPage - 2) + i;
                    if (page > totalPages) return null;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === (paginationUser?.totalPages ?? 1)}
                >
                  Sau
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
          {/* {isCreateModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Thêm người dùng mới
                </h2>

                <form
                  id="create-user-form"
                  onSubmit={handleCreateUser}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Họ tên
                    </label>
                    <input
                      type="text"
                      {...register("fullname")}
                      placeholder="Nhập họ tên"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                    />
                    {errors.fullname && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.fullname.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Email
                    </label>
                    <input
                      type="email"
                      {...register("email")}
                      placeholder="Nhập email"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      {...register("phone_number")}
                      placeholder="Nhập số điện thoại"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                    />
                    {errors.phone_number && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.phone_number.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Mật khẩu
                    </label>
                    <input
                      type="password"
                      {...register("password")}
                      placeholder="Nhập mật khẩu"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                    />
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Vai trò
                    </label>
                    <select
                      {...register("role")}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                    >
                      <option value="USER">Nguời dùng</option>
                      <option value="STAFF">Nhân viên</option>
                      <option value="ADMIN">Quản trị viên</option>
                    </select>
                    {errors.role && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.role.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Vai trò
                    </label>
                    <select
                      {...register("verify")}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                    >
                      <option value="VERIFIED">Đã xác thực</option>
                      <option value="UNVERIFIED">Chưa xác thực</option>
                      <option value="BANNED">Bị cấm\</option>
                    </select>
                    {errors.role && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.role.message}
                      </p>
                    )}
                  </div>
                </form>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    form="create-user-form"
                    className="flex-1"
                  >
                    Tạo người dùng
                  </Button>
                </div>
              </div>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}

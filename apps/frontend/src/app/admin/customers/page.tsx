"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { DataTable } from "@/components/TableCustom";
import { CustomerStats } from "@/components/customers/customer-stats";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@radix-ui/react-label";
import {
  userProfileSchema,
  UserProfile,
  adminUpdateUserSchema,
  AdminUpdateUserSchemaFormData,
  CreateUserFormData,
  createUserSchema,
} from "@schemas/userSchema";
import {
  resetPasswordSchema,
  ResetPasswordSchemaFormData,
} from "@schemas/authSchema";
import type { VerifyStatus, UserRole } from "@custom-types";
import { Plus } from "lucide-react";
import { useUserActions } from "@/hooks/use-user";
import { userColumns } from "@/columns/user-columns";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
export default function CustomersPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
  });

  const {
    register: registerResetPassword,
    handleSubmit: handleSubmitResetPassword,
    formState: { errors: errorsResetPassword },
    reset: resetResetPassword,
  } = useForm<ResetPasswordSchemaFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const {
    register: registerUpdateProfile,
    handleSubmit: handleSubmitUpdateProfile,
    formState: { errors: errorsUpdateProfile },
    reset: resetUpdateProfile,
    setValue: setValueUpdateProfile,
  } = useForm<AdminUpdateUserSchemaFormData>({
    resolver: zodResolver(adminUpdateUserSchema),
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [verifyFilter, setVerifyFilter] = useState<VerifyStatus | "all">("all");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState<number>(10);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const {
    users,
    getAllUsers,
    isLoading,
    getAllStatistics,
    isLoadingStatistics,
    getSearchUsers,
    createUser,
    isFetching,
    paginationUser,
    detailUserData,
    isLoadingDetailUser,
    getDetailUser,
    dashboardStatsData,
    resetPassword,
    updateProfileUser,
    getRefetchDashboardStats,
  } = useUserActions({
    hasToken: true,
    limit: limit,
    page: currentPage,
    verify: verifyFilter === "all" ? "" : verifyFilter,
    role: roleFilter === "all" ? "" : (roleFilter as UserRole),
    searchQuery: searchQuery,
    id: selectedUserId || "",
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
  const handleReset = () => {
    setSearchQuery("");
    setVerifyFilter("all");
    setRoleFilter("all");
    setCurrentPage(1);
  };
  const handleFilterChange = () => {
    setCurrentPage(1);
  };
  if (isLoading && isLoadingStatistics && isFetching) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
        <Loader2 className="animate-spin w-16 h-16 text-primary" />
      </div>
    );
  }
  const handleCreateUser = handleSubmit((data) => {
    createUser({
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      YOB: data.YOB,
    });
    setIsCreateModalOpen(false);
    console.log("[v0] Create user:", data);
    reset();
    // router.push("/admin/customers/create");
  });
  const handleDetailUser = (id: string) => {
    router.push(`/admin/customers/detail/${id}`);
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
                // router.push("/admin/customers/create");
                setIsCreateModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm người dùng
            </Button>
          </div>
        </div>

        {dashboardStatsData?.data?.GetUserStats?.data && (
          <CustomerStats stats={dashboardStatsData.data.GetUserStats.data} />
        )}

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
                  setVerifyFilter(e.target.value as VerifyStatus | "all");
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
                <option value="SOS">SOS</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Hiển thị {paginationUser?.page ?? 1} /{" "}
            {paginationUser?.totalPages ?? 1} trang
          </p>
          <DataTable
            title="Danh sách người dùng"
            columns={userColumns({
              onView: (user) => {
                handleDetailUser(String(user.accountId));
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
          </div>
        </div>
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b bg-muted/30">
                <h2 className="text-xl font-bold text-foreground">
                  Thêm người dùng mới
                </h2>
                <p className="text-sm text-muted-foreground">
                  Nhập thông tin chi tiết để tạo tài khoản.
                </p>
              </div>

              <form
                id="create-user-form"
                onSubmit={handleCreateUser}
                className="p-6 space-y-4"
              >
                {/* Họ tên */}
                <div className="space-y-2">
                  <Label htmlFor="name">Họ tên</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Nhập họ tên"
                  />
                  {errors.name && (
                    <p className="text-destructive text-xs font-medium">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="example@mail.com"
                  />
                  {errors.email && (
                    <p className="text-destructive text-xs font-medium">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Số điện thoại */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...register("phone")}
                      placeholder="09xxx"
                    />
                    {errors.phone && (
                      <p className="text-destructive text-xs font-medium">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  {/* Năm sinh - ĐÃ FIX LỖI INVALID INPUT */}
                  <div className="space-y-2">
                    <Label htmlFor="yob">Năm sinh</Label>
                    <Input
                      id="yob"
                      type="number"
                      {...register("YOB", { valueAsNumber: true })} // Quan trọng nhất
                      placeholder="1995"
                    />
                    {errors.YOB && (
                      <p className="text-destructive text-xs font-medium">
                        {errors.YOB.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Vai trò */}
                <div className="space-y-2">
                  <Label htmlFor="role">Vai trò hệ thống</Label>
                  <select
                    {...register("role")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="USER">Người dùng (User)</option>
                    <option value="STAFF">Nhân viên (Staff)</option>
                    <option value="ADMIN">Quản trị viên (Admin)</option>
                    <option value="SOS">Cấp cứu (SOS)</option>
                  </select>
                  {errors.role && (
                    <p className="text-destructive text-xs font-medium">
                      {errors.role.message}
                    </p>
                  )}
                </div>

                {/* Nút điều hướng */}
                <div className="flex gap-3 mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      reset();
                    }}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 gradient-primary shadow-glow"
                  >
                    Tạo người dùng
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

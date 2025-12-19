"use client";

import {  useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { DataTable } from "@/components/TableCustom";
import { CustomerStats } from "@/components/customers/customer-stats";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { userProfileSchema, UserProfile, adminUpdateUserSchema, AdminUpdateUserSchemaFormData } from "@schemas/userSchema";
import { resetPasswordSchema, ResetPasswordSchemaFormData } from "@schemas/authSchema";
import type { VerifyStatus, UserRole } from "@custom-types";
import { Plus } from "lucide-react";
import { useUserActions } from "@/hooks/use-user";
import { userColumns } from "@/columns/user-columns";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { formatDateUTC } from "@/utils/formatDateTime";
export default function CustomersPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserProfile>({
    resolver: zodResolver(userProfileSchema),
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
  const [limit,] = useState<number>(10);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"info" | "activity" | "stats">("info");
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
  }, [searchQuery, verifyFilter, roleFilter, getAllUsers, getAllStatistics, currentPage, getRefetchDashboardStats]);
  const handleReset = () => {
    setSearchQuery("");
    setVerifyFilter("all");
    setRoleFilter("all");
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };
  useEffect(() => {
    if (!searchQuery) getAllUsers();
    else getSearchUsers();
  }, [searchQuery, verifyFilter, roleFilter, getAllUsers, getSearchUsers, currentPage]);

  useEffect(() => {
    if (selectedUserId) {
      getDetailUser();
    }
  }, [selectedUserId, getDetailUser]);
  if (isLoading && isLoadingStatistics && isFetching) {
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
  const handleCreateUser = handleSubmit((data) => {
    createUser({
      fullname: data.fullname,
      email: data.email,
      verify: "UNVERIFIED" as VerifyStatus,
      phone_number: data.phone_number,
      password: data.password,
      role: data.role,
    });
    console.log("[v0] Create user:", data);
    setIsCreateModalOpen(false);
    reset();
  });

  const handleResetPassword = handleSubmitResetPassword((data) => {
    resetPassword({new_password: data.password, confirm_new_password: data.confirm_password});
    console.log("[v0] Reset password:", data);
    setIsResetPasswordModalOpen(false);
    resetResetPassword();
  });

  const handleUpdateProfile = handleSubmitUpdateProfile((data) => {
    updateProfileUser({
      fullname: data.fullname,
      email: detailUserData?.data?.result?.email || "",
      phone_number: data.phone_number || "",
      password: "",
      role: detailUserData?.data?.result?.role || "USER",
      location: data.location || "",
      username: data.username || "",
    } as UserProfile);
    console.log("[v0] Update profile:", data);
    setIsEditProfileModalOpen(false);
    resetUpdateProfile();
  });
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
                setIsCreateModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm người dùng
            </Button>
          </div>
        </div>

        {dashboardStatsData && (
          <CustomerStats stats={dashboardStatsData.result} />
        )}

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
                setSelectedUserId(user.id);
                setIsDetailModalOpen(true);
              },
            })}
            data={users || []}
            // filterPlaceholder="Tìm kiếm người dùng..."
          />

          {/* {totalPages >= 1 && (
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
          )} */}
          <div className="pt-3">
            <PaginationDemo
              currentPage={currentPage}
              totalPages={paginationUser?.totalPages ?? 1}
              onPageChange={setCurrentPage}
            />
          </div>

          {/* Detail User Modal */}
          {isDetailModalOpen && detailUserData && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground">
                    Chi tiết người dùng
                  </h2>
                  <button
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      setSelectedUserId(null);
                      setDetailTab("info");
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                {isLoadingDetailUser ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin w-8 h-8 text-primary" />
                  </div>
                ) : (
                  <>
                    {/* Tabs for different sections */}
                    <div className="flex gap-2 mb-6 border-b border-border">
                      <button
                        onClick={() => setDetailTab("info")}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          detailTab === "info"
                            ? "text-primary border-b-2 border-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Thông tin
                      </button>
                      <button
                        onClick={() => setDetailTab("activity")}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          detailTab === "activity"
                            ? "text-primary border-b-2 border-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Hoạt động
                      </button>
                      <button
                        onClick={() => setDetailTab("stats")}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          detailTab === "stats"
                            ? "text-primary border-b-2 border-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Thống kê
                      </button>
                    </div>

                    {/* Tab: Info */}
                    {detailTab === "info" && (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">ID</p>
                          <p className="text-foreground font-medium">
                            {detailUserData?.data?.result?._id}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">
                            Họ tên
                          </p>
                          <p className="text-foreground font-medium">
                            {detailUserData?.data?.result?.fullname}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="text-foreground font-medium">
                            {detailUserData?.data?.result?.email}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">
                            Số điện thoại
                          </p>
                          <p className="text-foreground font-medium">
                            {detailUserData?.data?.result?.phone_number}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">
                            Username
                          </p>
                          <p className="text-foreground font-medium">
                            {detailUserData?.data?.result?.username}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">
                            Vai trò
                          </p>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              detailUserData?.data?.result?.role === "ADMIN"
                                ? "bg-red-100 text-red-800"
                                : detailUserData?.data?.result?.role === "STAFF"
                                  ? "bg-blue-100 text-blue-800"
                                  : detailUserData?.data?.result?.role === "SOS"
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-green-100 text-green-800"
                            }`}
                          >
                            {detailUserData?.data?.result?.role}
                          </span>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">
                            Trạng thái xác thực
                          </p>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              detailUserData?.data?.result?.verify ===
                              "VERIFIED"
                                ? "bg-green-100 text-green-800"
                                : detailUserData?.data?.result?.verify ===
                                    "UNVERIFIED"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {detailUserData?.data?.result?.verify}
                          </span>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">
                            Địa chỉ
                          </p>
                          <p className="text-foreground font-medium">
                            {detailUserData?.data?.result?.location ||
                              "Chưa có"}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">
                            NFC Card UID
                          </p>
                          <p className="text-foreground font-medium">
                            {detailUserData?.data?.result?.nfc_card_uid ||
                              "Chưa có"}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">
                            Ngày tạo
                          </p>
                          <p className="text-foreground font-medium">
                            {formatDateUTC(detailUserData?.data?.result?.created_at) || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">
                            Lần cập nhật cuối
                          </p>
                          <p className="text-foreground font-medium">
                            {formatDateUTC(detailUserData?.data?.result?.updated_at) || "-"}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Tab: Activity */}
                    {detailTab === "activity" && (
                      <div className="space-y-3">
                        <div className="bg-muted rounded-lg p-4 text-center">
                          <p className="text-sm text-muted-foreground">
                            Không có dữ liệu hoạt động
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Tab: Stats */}
                    {detailTab === "stats" && (
                      <div className="space-y-3">
                        <div className="bg-muted rounded-lg p-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-primary/10 border border-primary rounded p-3">
                              <p className="text-xs text-primary">
                                ID Người dùng
                              </p>
                              <p className="text-2xl font-bold text-primary">
                                {detailUserData?.data?.result?._id.slice(0, 8)}
                              </p>
                            </div>

                            <div className="bg-blue-100 border border-blue-300 rounded p-3">
                              <p className="text-xs text-blue-600">Email</p>
                              <p className="text-sm font-bold text-blue-800">
                                {detailUserData?.data?.result?.email}
                              </p>
                            </div>

                            <div className={`border rounded p-3 ${
                              detailUserData?.data?.result?.role === "ADMIN"
                                ? "bg-red-100 border-red-300"
                                : detailUserData?.data?.result?.role === "STAFF"
                                  ? "bg-blue-100 border-blue-300"
                                  : detailUserData?.data?.result?.role === "SOS"
                                    ? "bg-orange-100 border-orange-300"
                                    : "bg-green-100 border-green-300"
                            }`}>
                              <p className={`text-xs ${
                                detailUserData?.data?.result?.role === "ADMIN"
                                  ? "text-red-600"
                                  : detailUserData?.data?.result?.role === "STAFF"
                                    ? "text-blue-600"
                                    : detailUserData?.data?.result?.role === "SOS"
                                      ? "text-orange-600"
                                      : "text-green-600"
                              }`}>Vai trò</p>
                              <p className={`text-lg font-bold ${
                                detailUserData?.data?.result?.role === "ADMIN"
                                  ? "text-red-800"
                                  : detailUserData?.data?.result?.role === "STAFF"
                                    ? "text-blue-800"
                                    : detailUserData?.data?.result?.role === "SOS"
                                      ? "text-orange-800"
                                      : "text-green-800"
                              }`}>
                                {detailUserData?.data?.result?.role}
                              </p>
                            </div>

                            <div className="bg-yellow-100 border border-yellow-300 rounded p-3">
                              <p className="text-xs text-yellow-600">
                                Trạng thái
                              </p>
                              <p className="text-lg font-bold text-yellow-800">
                                {detailUserData?.data?.result?.verify}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      setSelectedUserId(null);
                      setDetailTab("info");
                    }}
                    className="flex-1"
                  >
                    Đóng
                  </Button>
                  <Button
                    onClick={() => {
                      if (detailUserData?.data?.result) {
                        setValueUpdateProfile("fullname", detailUserData.data.result.fullname || "");
                        setValueUpdateProfile("location", detailUserData.data.result.location || "");
                        setValueUpdateProfile("username", detailUserData.data.result.username || "");
                        setValueUpdateProfile("phone_number", detailUserData.data.result.phone_number || "");
                      }
                      setIsEditProfileModalOpen(true);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Chỉnh sửa
                  </Button>
                  <Button
                    onClick={() => {
                      setIsResetPasswordModalOpen(true);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Đặt lại mật khẩu
                  </Button>
                </div>
              </div>
            </div>
          )}

          {isCreateModalOpen && (
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
                      <option value="USER">Người dùng</option>
                      <option value="STAFF">Nhân viên</option>
                      <option value="ADMIN">Quản trị viên</option>
                      <option value="SOS">SOS</option>
                    </select>
                    {errors.role && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.role.message}
                      </p>
                    )}
                  </div>
                  {/* <div>
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
                  </div> */}
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
          )}

          {/* Edit Profile Modal */}
          {isEditProfileModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Chỉnh sửa thông tin người dùng
                </h2>

                {detailUserData?.data?.result && (
                  <div className="mb-4 p-3 bg-muted rounded-lg text-sm">
                    <p className="text-muted-foreground mb-2"><strong>Thông tin hiện tại:</strong></p>
                    <div className="space-y-1 text-xs">
                      <p><strong>Họ tên:</strong> {detailUserData.data.result.fullname}</p>
                      <p><strong>Username:</strong> {detailUserData.data.result.username || "Chưa có"}</p>
                      <p><strong>SĐT:</strong> {detailUserData.data.result.phone_number || "Chưa có"}</p>
                      <p><strong>Địa chỉ:</strong> {detailUserData.data.result.location || "Chưa có"}</p>
                    </div>
                  </div>
                )}

                <form
                  id="edit-profile-form"
                  onSubmit={handleUpdateProfile}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Họ tên
                    </label>
                    <input
                      type="text"
                      {...registerUpdateProfile("fullname")}
                      placeholder="Nhập họ tên"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                    />
                    {errorsUpdateProfile.fullname && (
                      <p className="text-red-500 text-sm mt-1">
                        {errorsUpdateProfile.fullname.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Username
                    </label>
                    <input
                      type="text"
                      {...registerUpdateProfile("username")}
                      placeholder="Nhập username"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                    />
                    {errorsUpdateProfile.username && (
                      <p className="text-red-500 text-sm mt-1">
                        {errorsUpdateProfile.username.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      {...registerUpdateProfile("phone_number")}
                      placeholder="Nhập số điện thoại"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                    />
                    {errorsUpdateProfile.phone_number && (
                      <p className="text-red-500 text-sm mt-1">
                        {errorsUpdateProfile.phone_number.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Địa chỉ
                    </label>
                    <input
                      type="text"
                      {...registerUpdateProfile("location")}
                      placeholder="Nhập địa chỉ"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                    />
                    {errorsUpdateProfile.location && (
                      <p className="text-red-500 text-sm mt-1">
                        {errorsUpdateProfile.location.message}
                      </p>
                    )}
                  </div>

                </form>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditProfileModalOpen(false);
                      resetUpdateProfile();
                    }}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    form="edit-profile-form"
                    className="flex-1"
                  >
                    Cập nhật
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Reset Password Modal */}
          {isResetPasswordModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Đặt lại mật khẩu
                </h2>

                <form
                  id="reset-password-form"
                  onSubmit={handleResetPassword}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      {...registerResetPassword("password")}
                      placeholder="Nhập mật khẩu mới"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                    />
                    {errorsResetPassword.password && (
                      <p className="text-red-500 text-sm mt-1">
                        {errorsResetPassword.password.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Xác nhận mật khẩu
                    </label>
                    <input
                      type="password"
                      {...registerResetPassword("confirm_password")}
                      placeholder="Xác nhận mật khẩu mới"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                    />
                    {errorsResetPassword.confirm_password && (
                      <p className="text-red-500 text-sm mt-1">
                        {errorsResetPassword.confirm_password.message}
                      </p>
                    )}
                  </div>
                </form>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsResetPasswordModalOpen(false);
                      resetResetPassword();
                    }}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    form="reset-password-form"
                    className="flex-1"
                  >
                    Đặt lại
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


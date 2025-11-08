"use client";

import {  useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { DataTable } from "@/components/TableCustom";
import { Button } from "@/components/ui/button";
import type { VerifyStatus, UserRole } from "@custom-types";
import { useUserActions } from "@/hooks/use-user";
import { userColumns } from "@/columns/user-columns";
import { PaginationDemo } from "@/components/PaginationCustomer";

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [verifyFilter, setVerifyFilter] = useState<VerifyStatus | "all">("all");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit,] = useState<number>(10);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"info" | "activity" | "stats">("info");
  const {
    users,
    getAllUsers,
    isLoading,
    getAllStatistics,
    isLoadingStatistics,
    getSearchUsers,
    isFetching,
    paginationUser,
    detailUserData,
    isLoadingDetailUser,
    getDetailUser,
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
  }, [searchQuery, verifyFilter, roleFilter, getAllUsers, getAllStatistics, currentPage]);
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
        </div>
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
              </select>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Hiển thị {paginationUser?.currentPage ?? 1} /{" "}
            {paginationUser?.totalPages ?? 1} trang
          </p>
          <DataTable
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
                            {detailUserData?.data?.result?.created_at
                              ? new Date(
                                  detailUserData?.data?.result?.created_at
                                ).toLocaleString("vi-VN")
                              : "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">
                            Lần cập nhật cuối
                          </p>
                          <p className="text-foreground font-medium">
                            {detailUserData?.data?.result?.updated_at
                              ? new Date(
                                  detailUserData?.data?.result?.updated_at
                                ).toLocaleString("vi-VN")
                              : "-"}
                          </p>
                        </div>
                      </div>
                    )}
                    {detailTab === "activity" && (
                      <div className="space-y-3">
                        <div className="bg-muted rounded-lg p-4 text-center">
                          <p className="text-sm text-muted-foreground">
                            Không có dữ liệu hoạt động
                          </p>
                        </div>
                      </div>
                    )}
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

                            <div className="bg-green-100 border border-green-300 rounded p-3">
                              <p className="text-xs text-green-600">Vai trò</p>
                              <p className="text-lg font-bold text-green-800">
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


"use client";

<<<<<<< Updated upstream
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
=======
import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { CustomerCard } from "@/components/customers/customer-card";
import { CustomerFilters } from "@/components/customers/customer-filters";
import { CustomerStats } from "@/components/customers/customer-stats";
import { Button } from "@/components/ui/button";
import type { Customer, CustomerStatus, CustomerType } from "@/types/customer";
import type { DetailUser } from "@/types/user";
import { Plus, Download } from "lucide-react";

// Mock data
const mockCustomers: Customer[] = [
  {
    _id: "c1",
    customer_code: "KH-2024-001",
    full_name: "Nguyễn Văn An",
    email: "nguyenvanan@email.com",
    phone_number: "0901234567",
    address: "123 Nguyễn Huệ",
    city: "Hồ Chí Minh",
    id_number: "079123456789",
    customer_type: "individual",
    status: "active",
    avatar: "/placeholder.svg?height=100&width=100",
    total_rentals: 15,
    total_spent: 4500000,
    current_rentals: 1,
    rating: 4.8,
    registered_date: "2024-01-15T00:00:00Z",
    last_rental_date: "2024-06-10T00:00:00Z",
    created_at: "2024-01-15T00:00:00Z",
    updated_at: "2024-06-10T00:00:00Z",
  },
  {
    _id: "c2",
    customer_code: "KH-2024-002",
    full_name: "Lê Thị Mai",
    email: "lethimai@email.com",
    phone_number: "0912345678",
    address: "456 Lê Lợi",
    city: "Hà Nội",
    id_number: "001234567890",
    customer_type: "individual",
    status: "active",
    avatar: "/placeholder.svg?height=100&width=100",
    total_rentals: 23,
    total_spent: 6800000,
    current_rentals: 0,
    rating: 4.9,
    registered_date: "2024-01-10T00:00:00Z",
    last_rental_date: "2024-06-09T00:00:00Z",
    created_at: "2024-01-10T00:00:00Z",
    updated_at: "2024-06-09T00:00:00Z",
  },
  {
    _id: "c3",
    customer_code: "KH-2024-003",
    full_name: "Phạm Minh Tuấn",
    email: "phamminhtuan@email.com",
    phone_number: "0923456789",
    address: "789 Trần Hưng Đạo",
    city: "Đà Nẵng",
    id_number: "048123456789",
    customer_type: "individual",
    status: "active",
    avatar: "/placeholder.svg?height=100&width=100",
    total_rentals: 8,
    total_spent: 2400000,
    current_rentals: 1,
    rating: 4.5,
    registered_date: "2024-02-20T00:00:00Z",
    last_rental_date: "2024-06-10T00:00:00Z",
    created_at: "2024-02-20T00:00:00Z",
    updated_at: "2024-06-10T00:00:00Z",
  },
  {
    _id: "c4",
    customer_code: "KH-2024-004",
    full_name: "Võ Thị Hương",
    email: "vothihuong@email.com",
    phone_number: "0934567890",
    address: "321 Hai Bà Trưng",
    city: "Hồ Chí Minh",
    id_number: "079987654321",
    customer_type: "individual",
    status: "inactive",
    avatar: "/placeholder.svg?height=100&width=100",
    total_rentals: 3,
    total_spent: 900000,
    current_rentals: 0,
    rating: 4.2,
    registered_date: "2024-03-05T00:00:00Z",
    last_rental_date: "2024-04-15T00:00:00Z",
    created_at: "2024-03-05T00:00:00Z",
    updated_at: "2024-04-15T00:00:00Z",
  },
  {
    _id: "c5",
    customer_code: "KH-2024-005",
    full_name: "Công ty TNHH ABC",
    email: "contact@abc.com",
    phone_number: "0945678901",
    address: "555 Võ Văn Tần",
    city: "Hồ Chí Minh",
    id_number: "0123456789",
    customer_type: "corporate",
    status: "active",
    avatar: "/placeholder.svg?height=100&width=100",
    total_rentals: 45,
    total_spent: 18500000,
    current_rentals: 3,
    rating: 4.9,
    notes: "Khách hàng doanh nghiệp VIP",
    registered_date: "2023-12-01T00:00:00Z",
    last_rental_date: "2024-06-08T00:00:00Z",
    created_at: "2023-12-01T00:00:00Z",
    updated_at: "2024-06-08T00:00:00Z",
  },
  {
    _id: "c6",
    customer_code: "KH-2024-006",
    full_name: "Đặng Quốc Bảo",
    email: "dangquocbao@email.com",
    phone_number: "0956789012",
    address: "888 Nguyễn Thị Minh Khai",
    city: "Cần Thơ",
    id_number: "092123456789",
    customer_type: "individual",
    status: "active",
    avatar: "/placeholder.svg?height=100&width=100",
    total_rentals: 12,
    total_spent: 3600000,
    current_rentals: 0,
    rating: 4.7,
    registered_date: "2024-02-10T00:00:00Z",
    last_rental_date: "2024-06-07T00:00:00Z",
    created_at: "2024-02-10T00:00:00Z",
    updated_at: "2024-06-07T00:00:00Z",
  },
  {
    _id: "c7",
    customer_code: "KH-2024-007",
    full_name: "Bùi Thị Lan",
    email: "buithilan@email.com",
    phone_number: "0967890123",
    address: "222 Lý Thường Kiệt",
    city: "Nha Trang",
    id_number: "058123456789",
    customer_type: "individual",
    status: "blocked",
    avatar: "/placeholder.svg?height=100&width=100",
    total_rentals: 2,
    total_spent: 400000,
    current_rentals: 0,
    rating: 2.5,
    notes: "Vi phạm quy định thuê xe nhiều lần",
    registered_date: "2024-04-01T00:00:00Z",
    last_rental_date: "2024-05-10T00:00:00Z",
    created_at: "2024-04-01T00:00:00Z",
    updated_at: "2024-05-10T00:00:00Z",
  },
  {
    _id: "c8",
    customer_code: "KH-2024-008",
    full_name: "Trương Văn Đức",
    email: "truongvanduc@email.com",
    phone_number: "0978901234",
    address: "999 Điện Biên Phủ",
    city: "Hồ Chí Minh",
    id_number: "079111222333",
    customer_type: "individual",
    status: "active",
    avatar: "/placeholder.svg?height=100&width=100",
    total_rentals: 28,
    total_spent: 8400000,
    current_rentals: 2,
    rating: 4.8,
    registered_date: "2024-01-05T00:00:00Z",
    last_rental_date: "2024-06-09T00:00:00Z",
    created_at: "2024-01-05T00:00:00Z",
    updated_at: "2024-06-09T00:00:00Z",
  },
];

// Mock user for DashboardLayout
const mockUser: DetailUser = {
  _id: "507f1f77bcf86cd799439011",
  fullName: "Nguyễn Văn Minh",
  email: "minh.nguyen@bikerental.vn",
  verify: "verified",
  location: "Hà Nội, Việt Nam",
  username: "minh_staff",
  phone_number: "+84 912 345 678",
  avatar: "/professional-avatar.png",
  role: "admin",
  created_at: "2024-01-15T08:30:00Z",
  updated_at: "2025-01-06T10:20:00Z",
};

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | "all">(
    "all"
  );
  const [typeFilter, setTypeFilter] = useState<CustomerType | "all">("all");
  const [cityFilter, setCityFilter] = useState("all");

  const filteredCustomers = mockCustomers.filter((customer) => {
    const matchesSearch =
      customer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone_number.includes(searchQuery) ||
      customer.customer_code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || customer.status === statusFilter;
    const matchesType =
      typeFilter === "all" || customer.customer_type === typeFilter;
    const matchesCity = cityFilter === "all" || customer.city === cityFilter;

    return matchesSearch && matchesStatus && matchesType && matchesCity;
>>>>>>> Stashed changes
  });

  const handleReset = () => {
    setSearchQuery("");
<<<<<<< Updated upstream
    setVerifyFilter("all");
    setRoleFilter("all");
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
=======
    setStatusFilter("all");
    setTypeFilter("all");
    setCityFilter("all");
  };

  const stats = {
    total: mockCustomers.length,
    active: mockCustomers.filter((c) => c.status === "active").length,
    inactive: mockCustomers.filter((c) => c.status === "inactive").length,
    blocked: mockCustomers.filter((c) => c.status === "blocked").length,
    newThisMonth: mockCustomers.filter((c) => {
      const registeredDate = new Date(c.registered_date);
      const now = new Date();
      return (
        registeredDate.getMonth() === now.getMonth() &&
        registeredDate.getFullYear() === now.getFullYear()
      );
    }).length,
    totalRevenue: mockCustomers.reduce((sum, c) => sum + c.total_spent, 0),
    averageSpent: Math.round(
      mockCustomers.reduce((sum, c) => sum + c.total_spent, 0) /
        mockCustomers.length
    ),
    topCustomers: mockCustomers.filter((c) => c.total_spent > 5000000).length,
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
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
=======
              Quản lý khách hàng
            </h1>
            <p className="text-muted-foreground mt-1">
              Theo dõi và quản lý thông tin khách hàng
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Xuất Excel
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Thêm khách hàng
>>>>>>> Stashed changes
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
              </select>
            </div>
          </div>
        </div>

<<<<<<< Updated upstream
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Hiển thị {paginationUser?.currentPage ?? 1} /{" "}
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
=======
        {/* Stats */}
        <CustomerStats stats={stats} />

        {/* Filters */}
        <CustomerFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          cityFilter={cityFilter}
          onCityChange={setCityFilter}
          onReset={handleReset}
        />

        {/* Results */}
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Hiển thị {filteredCustomers.length} / {mockCustomers.length} khách
            hàng
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => (
              <CustomerCard
                key={customer._id}
                customer={customer}
                onView={(customer) =>
                  console.log("[v0] View customer:", customer._id)
                }
                onEdit={(customer) =>
                  console.log("[v0] Edit customer:", customer._id)
                }
                onBlock={(customer) =>
                  console.log("[v0] Block customer:", customer._id)
                }
              />
            ))}
          </div>
>>>>>>> Stashed changes
        </div>
      </div>
    </div>
  );
}


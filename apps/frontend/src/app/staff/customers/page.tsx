"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { CustomerCard } from "@/components/customers/customer-card";
import { CustomerStats } from "@/components/customers/customer-stats";
import { Button } from "@/components/ui/button";
import type { DetailUser, VerifyStatus, UserRole } from "@custom-types";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useUserActions } from "@/hooks/useUserAction";
const mockUsers: DetailUser[] = [
  {
    _id: "68e260a5d04813da448c56f1",
    fullname: "Nguyễn Văn An",
    email: "nguyenvanan@email.com",
    verify: "VERIFIED",
    location: "123 Nguyễn Huệ, Quận 1, TP.HCM",
    username: "nguyenvanan",
    phone_number: "0901234567",
    avatar: "/placeholder.svg?height=100&width=100",
    role: "USER",
    nfc_card_uid: "NFC001",
    email_verify_otp_expires: "2025-01-15T00:00:00Z",
    forgot_password_otp_expires: "2025-01-15T00:00:00Z",
    created_at: "2024-01-15T00:00:00Z",
    updated_at: "2024-06-10T00:00:00Z",
  },
  {
    _id: "68e260a5d04813da448c56f2",
    fullname: "Lê Thị Mai",
    email: "lethimai@email.com",
    verify: "VERIFIED",
    location: "456 Lê Lợi, Quận Hoàn Kiếm, Hà Nội",
    username: "lethimai",
    phone_number: "0912345678",
    avatar: "/placeholder.svg?height=100&width=100",
    role: "USER",
    nfc_card_uid: "NFC002",
    email_verify_otp_expires: "2025-01-15T00:00:00Z",
    forgot_password_otp_expires: "2025-01-15T00:00:00Z",
    created_at: "2024-01-10T00:00:00Z",
    updated_at: "2024-06-09T00:00:00Z",
  },
  {
    _id: "68e260a5d04813da448c56f3",
    fullname: "Phạm Minh Tuấn",
    email: "phamminhtuan@email.com",
    verify: "UNVERIFIED",
    location: "789 Trần Hưng Đạo, Quận Hải Châu, Đà Nẵng",
    username: "phamminhtuan",
    phone_number: "0923456789",
    avatar: "/placeholder.svg?height=100&width=100",
    role: "USER",
    nfc_card_uid: "NFC003",
    email_verify_otp_expires: "2025-01-20T00:00:00Z",
    forgot_password_otp_expires: "2025-01-20T00:00:00Z",
    created_at: "2024-02-20T00:00:00Z",
    updated_at: "2024-06-10T00:00:00Z",
  },
  {
    _id: "68e260a5d04813da448c56f4",
    fullname: "Võ Thị Hương",
    email: "vothihuong@email.com",
    verify: "BANNED",
    location: "321 Hai Bà Trưng, Quận 1, TP.HCM",
    username: "vothihuong",
    phone_number: "0934567890",
    avatar: "/placeholder.svg?height=100&width=100",
    role: "USER",
    nfc_card_uid: "NFC004",
    email_verify_otp_expires: "2025-01-15T00:00:00Z",
    forgot_password_otp_expires: "2025-01-15T00:00:00Z",
    created_at: "2024-03-05T00:00:00Z",
    updated_at: "2024-04-15T00:00:00Z",
  },
  {
    _id: "68e260a5d04813da448c56f5",
    fullname: "Trần Văn Hùng",
    email: "tranvanhung@email.com",
    verify: "VERIFIED",
    location: "555 Võ Văn Tần, Quận 3, TP.HCM",
    username: "tranvanhung",
    phone_number: "0945678901",
    avatar: "/placeholder.svg?height=100&width=100",
    role: "STAFF",
    nfc_card_uid: "NFC005",
    email_verify_otp_expires: "2025-01-15T00:00:00Z",
    forgot_password_otp_expires: "2025-01-15T00:00:00Z",
    created_at: "2023-12-01T00:00:00Z",
    updated_at: "2024-06-08T00:00:00Z",
  },
  {
    _id: "68e260a5d04813da448c56f6",
    fullname: "Đặng Quốc Bảo",
    email: "dangquocbao@email.com",
    verify: "VERIFIED",
    location: "888 Nguyễn Thị Minh Khai, Quận Ninh Kiều, Cần Thơ",
    username: "dangquocbao",
    phone_number: "0956789012",
    avatar: "/placeholder.svg?height=100&width=100",
    role: "USER",
    nfc_card_uid: "NFC006",
    email_verify_otp_expires: "2025-01-15T00:00:00Z",
    forgot_password_otp_expires: "2025-01-15T00:00:00Z",
    created_at: "2024-02-10T00:00:00Z",
    updated_at: "2024-06-07T00:00:00Z",
  },
  {
    _id: "68e260a5d04813da448c56f7",
    fullname: "Hoàng Minh Khôi",
    email: "hoangminhkhoi@email.com",
    verify: "VERIFIED",
    location: "999 Lý Thường Kiệt, Quận 10, TP.HCM",
    username: "hoangminhkhoi",
    phone_number: "0967890123",
    avatar: "/placeholder.svg?height=100&width=100",
    role: "USER",
    nfc_card_uid: "NFC007",
    email_verify_otp_expires: "2025-01-15T00:00:00Z",
    forgot_password_otp_expires: "2025-01-15T00:00:00Z",
    created_at: "2024-03-15T00:00:00Z",
    updated_at: "2024-06-06T00:00:00Z",
  },
  {
    _id: "68e260a5d04813da448c56f8",
    fullname: "Ngô Thị Linh",
    email: "ngothilinh@email.com",
    verify: "UNVERIFIED",
    location: "111 Cách Mạng Tháng 8, Quận 3, TP.HCM",
    username: "ngothilinh",
    phone_number: "0978901234",
    avatar: "/placeholder.svg?height=100&width=100",
    role: "USER",
    nfc_card_uid: "NFC008",
    email_verify_otp_expires: "2025-01-20T00:00:00Z",
    forgot_password_otp_expires: "2025-01-20T00:00:00Z",
    created_at: "2024-04-01T00:00:00Z",
    updated_at: "2024-06-05T00:00:00Z",
  },
  {
    _id: "68e260a5d04813da448c56f9",
    fullname: "Lý Văn Sơn",
    email: "lyvanson@email.com",
    verify: "VERIFIED",
    location: "222 Nguyễn Văn Cừ, Quận 5, TP.HCM",
    username: "lyvanson",
    phone_number: "0989012345",
    avatar: "/placeholder.svg?height=100&width=100",
    role: "STAFF",
    nfc_card_uid: "NFC009",
    email_verify_otp_expires: "2025-01-15T00:00:00Z",
    forgot_password_otp_expires: "2025-01-15T00:00:00Z",
    created_at: "2024-01-20T00:00:00Z",
    updated_at: "2024-06-04T00:00:00Z",
  },
  {
    _id: "68e260a5d04813da448c56fa",
    fullname: "Trịnh Thị Hà",
    email: "trinhthiha@email.com",
    verify: "VERIFIED",
    location: "333 Đinh Tiên Hoàng, Quận 1, TP.HCM",
    username: "trinhthiha",
    phone_number: "0990123456",
    avatar: "/placeholder.svg?height=100&width=100",
    role: "USER",
    nfc_card_uid: "NFC010",
    email_verify_otp_expires: "2025-01-15T00:00:00Z",
    forgot_password_otp_expires: "2025-01-15T00:00:00Z",
    created_at: "2024-02-05T00:00:00Z",
    updated_at: "2024-06-03T00:00:00Z",
  },
];

// Mock user for DashboardLayout

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [verifyFilter, setVerifyFilter] = useState<VerifyStatus | "all">("all");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState<number>(5); // Items per page
  const {
    users,
    getAllUsers,
    isFetching,
    getAllStatistics,
    isLoadingStatistics,
    statistics,
    getSearchUsers,
  } = useUserActions({
    hasToken: true,
    limit: limit,
    page: currentPage,
    verify: verifyFilter === "all" ? "" : verifyFilter,
    role: roleFilter === "all" ? undefined : (roleFilter as UserRole),
    searchQuery: searchQuery,
  });
  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone_number.includes(searchQuery) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVerify =
      verifyFilter === "all" || user.verify === verifyFilter;
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesVerify && matchesRole;
  });
  const totalPages = Math.ceil(filteredUsers.length / limit);
  const startIndex = (currentPage - 1) * limit;
  const endIndex = startIndex + limit;
  useEffect(() => {
    getAllUsers();
    getAllStatistics();
  }, [searchQuery, verifyFilter, roleFilter, currentPage, getAllUsers, getAllStatistics]);
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
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };
  useEffect(() => {
    if (!searchQuery) getAllUsers();
    else getSearchUsers();
    console.log(users);
  }, [searchQuery, verifyFilter, roleFilter, users, getAllUsers , getSearchUsers] );
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
            {/* <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Xuất Excel
            </Button> */}
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Thêm người dùng
            </Button>
          </div>
        </div>

        {/* Stats */}
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
            Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)}{" "}
            / {filteredUsers.length} người dùng
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
                Trang {currentPage} / {totalPages}
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    )
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Sau
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

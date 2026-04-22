"use client";

import { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/TableCustom";
import { CustomerStats } from "@/components/customers/customer-stats";
import { Button } from "@/components/ui/button";
import { userColumns } from "@/columns/user-columns";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { TableSkeleton } from "@/components/table-skeleton";
import type { DetailUser , Pagination ,VerifyStatus , GetUserDashboardStatsResponse} from "@custom-types";
type UserStatusFilter = VerifyStatus | "BANNED" | "all";

// Định nghĩa cấu trúc Props nhận từ Container (page.tsx)
interface CustomersClientProps {
  data: {
    users: DetailUser[];
    dashboardStatsData?: GetUserDashboardStatsResponse;
    paginationUser?: Pagination;
    isVisualLoading: boolean;
  };
  filters: {
    searchQuery: string;
    verifyFilter: UserStatusFilter;
    currentPage: number;
  };
  actions: {
    setSearchQuery: Dispatch<SetStateAction<string>>;
    setVerifyFilter: Dispatch<SetStateAction<UserStatusFilter>>;
    setCurrentPage: Dispatch<SetStateAction<number>>;
    handleReset: () => void;
    handleFilterChange: () => void;
  };
}

export default function CustomersClient({
  data: { users, dashboardStatsData, paginationUser, isVisualLoading },
  filters: { searchQuery, verifyFilter, currentPage },
  actions: {
    setSearchQuery,
    setVerifyFilter,
    setCurrentPage,
    handleReset,
    handleFilterChange,
  },
}: CustomersClientProps) {
  const router = useRouter();

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
            <p className="mt-1 text-muted-foreground">
              Theo dõi và quản lý thông tin người dùng hệ thống
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => router.push("/admin/customers/create")}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm người dùng
            </Button>
          </div>
        </div>

        {dashboardStatsData && <CustomerStats stats={dashboardStatsData} />}

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
                  handleFilterChange(); // Đưa về trang 1 khi đổi bộ lọc
                }}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
              >
                <option value="all">Tất cả</option>
                <option value="VERIFIED">Đã xác thực</option>
                <option value="UNVERIFIED">Chưa xác thực</option>
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
                <p className="mb-4 text-sm text-muted-foreground">
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
                  data={users}
                  searchValue={searchQuery}
                  filterPlaceholder="Tìm kiếm người dùng"
                  onSearchChange={setSearchQuery} // Cập nhật search query
                />

                <div className="pt-3">
                  <PaginationDemo
                    currentPage={currentPage}
                    totalPages={paginationUser?.totalPages ?? 1}
                    onPageChange={setCurrentPage} // Cập nhật trang
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

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
import { UserFilters } from "./components/customer-filter";
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

        <UserFilters
          verifyFilter={verifyFilter}
          setVerifyFilter={setVerifyFilter}
          handleFilterChange={handleFilterChange}
          onReset={() => {
            setSearchQuery("");
            setCurrentPage(1);
          }}
        />

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

"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Supplier } from "@custom-types";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSupplierActions } from "@/hooks/use-supplier";
import { columns } from "@/columns/supplier-column";
import { Loader2 } from "lucide-react";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@components/PaginationCustomer";


export default function SuppliersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ACTIVE" | "INACTIVE" | "TERMINATED" | ""
  >("ACTIVE");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const router = useRouter();
  const {
    useGetAllSupplierQuery,
    changeStatusSupplier,
  } = useSupplierActions(true);

  const { data: supplierData, isLoading: isLoadingGetAllSuppliers } =
    useGetAllSupplierQuery(page, limit, statusFilter);

  useEffect(() => {
    setPage(1);
    setLimit(10);
  }, [statusFilter, searchQuery]);

  const handleChangeStatusFilter = (
    status: "ACTIVE" | "INACTIVE" | "TERMINATED" | ""
  ) => {
    setStatusFilter(status);
  };

  const handleViewSupplier = (supplier: Supplier) => {
    router.push(`/admin/suppliers/${supplier.id}`);
  };
  return (
    <div>
      {isLoadingGetAllSuppliers ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
          <Loader2 className="animate-spin w-16 h-16 text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Quản lý nhà cung cấp
              </h1>
              <p className="text-muted-foreground mt-1">
                Quản lý danh sách nhà cung cấp xe đạp
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.push("/admin/suppliers/create")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm nhà cung cấp
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Tổng nhà cung cấp</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {supplierData?.pagination.total || 0}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Đang hoạt động</p>
              <p className="text-2xl font-bold text-green-500 mt-1">
                {(supplierData?.data ?? []).filter(
                  (s) => s.status === "ACTIVE"
                ).length}
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên nhà cung cấp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground"
              />
              <select
                value={statusFilter}
                onChange={(e) =>
                  handleChangeStatusFilter(
                    e.target.value as "ACTIVE" | "INACTIVE" | "TERMINATED" | ""
                  )
                }
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Ngưng hoạt động</option>
                <option value="TERMINATED">Đã chấm dứt</option>
              </select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("");
                }}
              >
                Đặt lại
              </Button>
            </div>
          </div>

          <div className="w-full rounded-lg space-y-4  flex flex-col">
            <DataTable
              title="Danh sách nhà cung cấp"
              columns={columns({
                onView: handleViewSupplier,
                onChangeStatus: changeStatusSupplier,
              })}
              data={supplierData?.data ?? []}
            />
            <PaginationDemo
              totalPages={supplierData?.pagination?.totalPages ?? 1}
              currentPage={supplierData?.pagination?.page ?? 1}
              onPageChange={setPage}
            />
          </div>

          {/* modals and detail sections removed - handled in separate routes */}
        </div>
      )}
    </div>
  );
}

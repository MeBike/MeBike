"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Supplier } from "@custom-types";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSupplierActions } from "@/hooks/use-supplier";
import { columns } from "@/columns/supplier-column";
import { TableSkeleton } from "@/components/table-skeleton";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@components/PaginationCustomer";

export default function SupplierClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ACTIVE" | "INACTIVE" | "TERMINATED" | ""
  >("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(7);
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(false);
  const router = useRouter();
  const { changeStatusSupplier, isLoadingAllSuppliers, allSupplier ,getAllSuppliers} =
    useSupplierActions({
      hasToken: true,
      page: page,
      pageSize: pageSize,
      status: statusFilter,
    });
  useEffect(() => {
    getAllSuppliers();
    setPage(1);
  }, [statusFilter, searchQuery]);
  useEffect(() => {
    getAllSuppliers();
}, [page]);
  useEffect(() => {
    if (isLoadingAllSuppliers) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingAllSuppliers]);
  const handleChangeStatusFilter = (
    status: "ACTIVE" | "INACTIVE" | "TERMINATED" | "",
  ) => {
    setStatusFilter(status);
  };

  const handleViewSupplier = (supplier: Supplier) => {
    router.push(`/admin/suppliers/${supplier.id}`);
  };
  return (
    <div>
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
            <Button onClick={() => router.push("/admin/suppliers/create")}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm nhà cung cấp
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Tổng nhà cung cấp</p>
            <p className="text-2xl font-bold text-foreground mt-1">{100}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Đang hoạt động</p>
            <p className="text-2xl font-bold text-green-500 mt-1">{20}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Không hoạt động</p>
            <p className="text-2xl font-bold text-red-500 mt-1">{20}</p>
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
                  e.target.value as "ACTIVE" | "INACTIVE" | "TERMINATED" | "",
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
        <div className="min-h-[400px]">
          {isVisualLoading ? (
            <TableSkeleton />
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Hiển thị {allSupplier?.pagination?.page ?? 1} /{" "}
                  {allSupplier?.pagination?.totalPages ?? 1} trang
                </p>
              </div>
              <DataTable
                title="Danh sách nhà cung cấp"
                columns={columns({
                  onView: handleViewSupplier,
                  onChangeStatus: changeStatusSupplier,
                })}
                data={allSupplier?.data ?? []}
              />
              <div className="pt-3">
                <PaginationDemo
                  totalPages={allSupplier?.pagination?.totalPages ?? 1}
                  currentPage={allSupplier?.pagination?.page ?? 1}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

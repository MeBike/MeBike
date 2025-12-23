"use client";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Supplier } from "@/types/supplier.type";
import { Plus, X } from "lucide-react";
import { useSupplierActions } from "@/hooks/use-supplier";
import { useBikeActions } from "@/hooks/use-bike";
import { columns } from "@/columns/supplier-column";
import { Loader2 } from "lucide-react";
import {
  CreateSupplierSchema,
  createSupplierSchema,
} from "@/schemas/supplier.schema";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@components/PaginationCustomer";
import { Input } from "@/components/ui/input";
import { getStatusColor } from "@/utils/status-style";
import { formatToVNTime } from "@/lib/formateVNDate";

export default function SuppliersPage() {
  const {
    register: create,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
  } = useForm<CreateSupplierSchema>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      contactFee: 0,
    },
  });
  
  const {
    register: editRegister,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors },
    reset: resetEditForm,
  } = useForm<CreateSupplierSchema>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      contactFee: 0,
    },
  });
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "Active" | "Inactive" | ""
  >("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const { useGetAllBikeQuery } = useBikeActions(true);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const {
    useGetAllSupplierQuery,
    createSupplier,
    getBikeStatsSupplier,
    bikeStats,
    allStatsSupplier,
    isLoadingBikeStatsSupplier,
    changeStatusSupplier,
    isLoadingAllStatsSupplier,
    getAllStatsSupplier,
    isLoadingAllSupplier,
    getUpdateSupplier,
    paginationAllSupplier,
    allSupplier,
  } = useSupplierActions({hasToken:true, supplier_id : selectedSupplier?.id , limit : limit , page : page });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  useEffect(() => {
    setPage(1);
    setLimit(10);
  }, [statusFilter, searchQuery]);
  // const { data: bikeData, isLoading: isLoadingBike } = useGetAllBikeQuery({
  //   page: 1,
  //   limit: 1000,
  //   supplier_id: selectedSupplier?._id,
  // });
  const handleAddSupplier: SubmitHandler<CreateSupplierSchema> = (data) => {
    console.log("[v0] Adding supplier:", data);
    createSupplier({
      name: data.name,
      address: data.address,
      phone: data.phone,
      contactFee: data.contactFee,
    });
    resetForm();
    setIsModalOpen(false);
  };

  const handleChangeStatusFilter = (
    status: "Active" | "Inactive" | ""
  ) => {
    setStatusFilter(status);
  };

  const handleViewSupplier = (supplier: Supplier) => {
    if (!supplier) return;
    if (selectedSupplier?.id === supplier.id && !isDetailModalOpen) {
      setIsDetailModalOpen(true);
      return;
    }
    setSelectedSupplier(supplier);
    setIsLoadingDetail(true);
    setIsDetailModalOpen(false);
  };

  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  // Khi supplier thay đổi, bắt đầu fetch
  useEffect(() => {
    if (!selectedSupplier) return;
    setIsLoadingDetail(true);
    getBikeStatsSupplier();
    getAllStatsSupplier();
  }, [selectedSupplier, getAllStatsSupplier, getBikeStatsSupplier]);

  // Khi dữ liệu đủ (không loading nữa), mở modal
  useEffect(() => {
    if (
      selectedSupplier &&
      !isLoadingBikeStatsSupplier &&
      !isLoadingAllStatsSupplier &&
      bikeStats &&
      allStatsSupplier
    ) {
      setIsLoadingDetail(false);
      setIsDetailModalOpen(true);
    }
  }, [
    selectedSupplier,
    isLoadingBikeStatsSupplier,
    isLoadingAllStatsSupplier,
    bikeStats,
    allStatsSupplier,
  ]);

  const handleUpdateSupplier: SubmitHandler<CreateSupplierSchema> = (data) => {
    if (!editingSupplier) return;
    getUpdateSupplier({
      id: editingSupplier.id,
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        contactFee: data.contactFee,
      },
    });
    resetEditForm();
    setIsEditModalOpen(false);
    setEditingSupplier(null);
  };
  return (
    <div>
      {isLoadingAllSupplier ? (
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
              {/* <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Xuất Excel
              </Button> */}
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Thêm nhà cung cấp
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Tổng nhà cung cấp</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {paginationAllSupplier?.total || 0}
              </p>
            </div>
            {/* <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Đang hoạt động</p>
              <p className="text-2xl font-bold text-green-500 mt-1">
                {supplierData?.data?.filter((s) => s.status === "HOẠT ĐỘNG")
                  .length || 0}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Tổng xe đạp</p>
              <p className="text-2xl font-bold text-blue-500 mt-1">
                {bikeData?.pagination.totalRecords || 0}
              </p>
            </div> */}
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
                    e.target.value as "Active" | "Inactive" | ""
                  )
                }
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="HOẠT ĐỘNG">Hoạt động</option>
                <option value="NGƯNG HOẠT ĐỘNG">Ngưng hoạt động</option>
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
                setIsDetailModalOpen,
                onChangeStatus: changeStatusSupplier,
                onEdit: (supplier: Supplier) => {
                  setEditingSupplier(supplier);
                  resetEditForm({
                    name: supplier.name,
                    address: supplier.contactInfo.address,
                    phone: supplier.contactInfo.phone,
                    contactFee: supplier.contactFee,
                  });
                  setIsEditModalOpen(true);
                },
              })}
              data={allSupplier ?? []}
            />
            <PaginationDemo
              totalPages={paginationAllSupplier?.totalPages ?? 1}
              currentPage={paginationAllSupplier?.page ?? 1}
              onPageChange={setPage}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">
                Thống kê xe đạp theo nhà cung cấp
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allStatsSupplier?.result.map((stat) => (
                  <div
                    key={stat.supplier_id}
                    className="bg-card border border-border rounded-lg p-4"
                  >
                    <h3 className="font-semibold text-foreground mb-3">
                      {stat.supplier_name}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tổng xe:</span>
                        <span className="font-medium text-foreground">
                          {stat.total_bikes}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Có sẵn:</span>
                        <span className="font-medium text-green-600">
                          {stat.active_bikes}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Đang thuê:
                        </span>
                        <span className="font-medium text-blue-600">
                          {stat.booked_bikes}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bị hỏng:</span>
                        <span className="font-medium text-red-600">
                          {stat.broken_bikes}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bảo trì:</span>
                        <span className="font-medium text-orange-600">
                          {stat.maintain_bikes}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Không có sẵn:
                        </span>
                        <span className="font-medium text-gray-600">
                          {stat.unavailable_bikes}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* <p className="text-sm text-muted-foreground">
              Hiển thị {supplierData?.pagination.totalRecords} /{" "}
              {supplierData?.pagination.totalRecords} nhà cung cấp
            </p> */}
          </div>

          {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <form
                onSubmit={handleSubmit(handleAddSupplier)}
                className="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
              >
                <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-foreground">
                      Thêm nhà cung cấp mới
                    </h2>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="p-1 hover:bg-muted rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Tên nhà cung cấp
                      </label>
                      <Input
                        id="name"
                        {...create("name")}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        placeholder="Nhập tên nhà cung cấp"
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Địa chỉ
                      </label>
                      <Input
                        type="text"
                        id="address"
                        {...create("address")}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        placeholder="Nhập địa chỉ"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Số điện thoại
                      </label>
                      <Input
                        type="text"
                        id="phone"
                        {...create("phone")}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        placeholder="Nhập số điện thoại"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Phí hợp đồng (0-1)
                      </label>
                      <Input
                        type="number"
                        id="contactFee"
                        step="0.01"
                        min="0"
                        max="1"
                        {...create("contactFee", { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        placeholder="Nhập phí hợp đồng (ví dụ: 0.1)"
                      />
                      {errors.contactFee && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.contactFee.message}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1"
                      >
                        Hủy
                      </Button>
                      <Button type="submit" className="flex-1">
                        Thêm nhà cung cấp
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}
          {isDetailModalOpen && selectedSupplier && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">
                    Chi tiết nhà cung cấp
                  </h2>
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="p-1 hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                {isLoadingDetail ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="animate-spin w-8 h-8 text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Supplier Info */}
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <h3 className="font-semibold text-foreground text-lg">
                        {selectedSupplier.name}
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Địa chỉ
                          </p>
                          <p className="text-foreground font-medium">
                            {selectedSupplier.contactInfo.address}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Số điện thoại
                          </p>
                          <p className="text-foreground font-medium">
                            {selectedSupplier.contactInfo.phone}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Phí hợp đồng
                          </p>
                          <p className="text-foreground font-medium">
                            {selectedSupplier.contactFee} VND
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Trạng thái
                          </p>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getStatusColor(selectedSupplier.status)}`}
                          >
                            {selectedSupplier.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Ngày tạo
                          </p>
                          <p className="text-foreground font-medium">
                            {selectedSupplier.createdAt ??
                              formatToVNTime(selectedSupplier.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {bikeStats?.result && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-foreground text-lg">
                          Thống kê xe đạp
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">
                              Tổng xe
                            </p>
                            <p className="text-2xl font-bold text-blue-600">
                              {bikeStats?.result[0].total_bikes}
                            </p>
                          </div>
                          <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">
                              Có sẵn
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                              {bikeStats?.result[0].active_bikes}
                            </p>
                          </div>
                          <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">
                              Đang thuê
                            </p>
                            <p className="text-2xl font-bold text-purple-600">
                              {bikeStats?.result[0].booked_bikes}
                            </p>
                          </div>
                          <div className="bg-red-50 dark:bg-red-950 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">
                              Bị hỏng
                            </p>
                            <p className="text-2xl font-bold text-red-600">
                              {bikeStats?.result[0].broken_bikes}
                            </p>
                          </div>
                          <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">
                              Bảo trì
                            </p>
                            <p className="text-2xl font-bold text-orange-600">
                              {bikeStats?.result[0].maintain_bikes}
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">
                              Không có sẵn
                            </p>
                            <p className="text-2xl font-bold text-gray-600">
                              {bikeStats?.result[0].unavailable_bikes}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsDetailModalOpen(false)}
                        className="flex-1"
                      >
                        Đóng
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {isEditModalOpen && editingSupplier && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <form
                onSubmit={handleEditSubmit(handleUpdateSupplier)}
                className="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
              >
                <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-foreground">
                      Chỉnh sửa nhà cung cấp
                    </h2>
                    <button
                      onClick={() => setIsEditModalOpen(false)}
                      className="p-1 hover:bg-muted rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Tên nhà cung cấp
                      </label>
                      <Input
                        {...editRegister("name")}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        placeholder="Nhập tên nhà cung cấp"
                      />
                      {editErrors.name && (
                        <p className="text-sm text-red-500 mt-1">
                          {editErrors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Địa chỉ
                      </label>
                      <Input
                        type="text"
                        {...editRegister("address")}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        placeholder="Nhập địa chỉ"
                      />
                      {editErrors.address && (
                        <p className="text-sm text-red-500 mt-1">
                          {editErrors.address.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Số điện thoại
                      </label>
                      <Input
                        type="text"
                        {...editRegister("phone")}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        placeholder="Nhập số điện thoại"
                      />
                      {editErrors.phone && (
                        <p className="text-sm text-red-500 mt-1">
                          {editErrors.phone.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Phí hợp đồng (0-1)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        {...editRegister("contactFee", { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        placeholder="Nhập phí hợp đồng (ví dụ: 0.1)"
                      />
                      {editErrors.contactFee && (
                        <p className="text-sm text-red-500 mt-1">
                          {editErrors.contactFee.message}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditModalOpen(false)}
                        className="flex-1"
                        type="button"
                      >
                        Hủy
                      </Button>
                      <Button type="submit" className="flex-1">
                        Cập nhật
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
